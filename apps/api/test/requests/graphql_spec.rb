# typed: false

require "rails_helper"

# HTTP を通して確かめる（入口ごとのログイン・Cookie のセッション・Origin の確認）
RSpec.describe "POST /graphql/:audience", type: :request do
  let(:password) { "test-password" }
  let(:me) { "{ me { id kind name clinic { id } } }" }
  let(:login) do
    "mutation($email: String!, $password: String!) { login(email: $email, password: $password) { viewer { kind name } errors { code } } }"
  end
  let(:logout) { "mutation { logout { errors { code } } }" }

  # 入口ごとの確かめで使う、3種類の人（患者・事務スタッフ・医師）
  shared_context "3種類の人がいる" do
    let!(:patient) { create(:patient, password: password) }
    let!(:clerk) { create(:clerk, password: password) }
    let!(:doctor) { create(:doctor, password: password) }
  end

  def graphql(audience, query, variables: {}, headers: {})
    post "/graphql/#{audience}", params: { query: query, variables: variables }.to_json, headers: { "Content-Type" => "application/json" }.merge(headers)
    response.parsed_body
  end

  def sign_in(audience, user) = graphql(audience, login, variables: { email: user.email, password: password }).dig("data", "login")

  def viewer(audience) = graphql(audience, me).dig("data", "me")

  def capture_log
    output = StringIO.new
    logger = ActiveSupport::Logger.new(output)
    logger.formatter = Rails.logger.formatter
    Rails.logger.broadcast_to(logger)
    yield
    Rails.logger.stop_broadcasting_to(logger)
    output.string
  end

  describe "正常系" do
    it "ログインすると Cookie でログインが続き、ログアウトすると切れる" do
      patient = create(:patient, password: password)
      expect(viewer(:patient)).to be_nil

      expect(sign_in(:patient, patient)).to eq("viewer" => { "kind" => "PATIENT", "name" => patient.name }, "errors" => [])
      expect(viewer(:patient)).to include("kind" => "PATIENT", "name" => patient.name, "clinic" => nil)

      graphql(:patient, logout)
      expect(viewer(:patient)).to be_nil
    end

    describe "入口は、利用者の種類ごと" do
      include_context "3種類の人がいる"

      it "同じブラウザで、3つの入口に同時にログインしていられる。1つをログアウトしても、ほかは切れない" do
        sign_in(:patient, patient)
        sign_in(:clerk, clerk)
        sign_in(:doctor, doctor)
        expect([ viewer(:patient), viewer(:clerk), viewer(:doctor) ].map { |each| each["name"] }).to eq([ patient.name, clerk.name, doctor.name ])

        graphql(:clerk, logout)

        expect(viewer(:clerk)).to be_nil
        expect(viewer(:patient)["name"]).to eq(patient.name)
        expect(viewer(:doctor)["name"]).to eq(doctor.name)
        expect(Session.count).to eq(2)
      end
    end

    it "問診の答えを、リクエストのログに出さない" do
      patient = create(:patient, password: password)
      appointment = create(:appointment, patient: patient, slot: create(:slot, starts_at: Time.current + 1.day))
      question = create(:questionnaire_question, clinic: appointment.clinic)
      sign_in(:patient, patient)
      mutation = "mutation($id: ID!, $answers: [QuestionnaireAnswerInput!]!) { saveQuestionnaire(appointmentId: $id, answers: $answers, submit: false) { errors { code } } }"

      result = nil
      log = capture_log do
        result = graphql(:patient, mutation, variables: { id: appointment.id.to_s, answers: [ { questionId: question.id.to_s, text: "だれにも言えない症状" } ] })
      end

      expect(result.dig("data", "saveQuestionnaire", "errors")).to eq([])
      expect(log).to include("saveQuestionnaire")
      expect(log).not_to include("だれにも言えない症状")
    end

    it "パスワードとメールアドレスを、リクエストのログに出さない" do
      patient = create(:patient, email: "secret-mail@example.com", password: password)

      log = capture_log { sign_in(:patient, patient) }

      expect(log).to include("[FILTERED]")
      expect(log).not_to include(password)
      expect(log).not_to include("secret-mail@example.com")
    end
  end

  describe "異常系" do
    describe "入口は、利用者の種類ごと" do
      include_context "3種類の人がいる"

      it "それぞれの入口では、その種類の人だけがログインできる（ほかの種類の人は、いないのと同じ）" do
        { patient: patient, clerk: clerk, doctor: doctor }.each do |audience, own|
          ([ patient, clerk, doctor ] - [ own ]).each do |other|
            expect(sign_in(audience, other)).to eq("viewer" => nil, "errors" => [ { "code" => "INVALID_CREDENTIALS" } ])
          end
          expect(sign_in(audience, own).dig("viewer", "name")).to eq(own.name)
        end
      end

      it "ある入口でログインしても、ほかの入口では、ログインしていない" do
        sign_in(:clerk, clerk)

        expect(viewer(:clerk)).to include("kind" => "CLERK", "clinic" => { "id" => clerk.clinic_id.to_s })
        expect(viewer(:patient)).to be_nil
        expect(viewer(:doctor)).to be_nil
        result = graphql(:doctor, "{ appointments { edges { node { id } } } }")
        expect(result["errors"].map { |error| error.dig("extensions", "code") }).to eq([ "UNAUTHENTICATED" ])
      end

      it "役割が変わった人の古いセッションは、前の入口で使えない" do
        sign_in(:clerk, clerk)
        clerk.update!(role: :doctor)

        expect(viewer(:clerk)).to be_nil
      end

      it "ない入口は 404" do
        post "/graphql/admin", params: { query: me }.to_json, headers: { "Content-Type" => "application/json" }
        expect(response).to have_http_status(:not_found)
        post "/graphql", params: { query: me }.to_json, headers: { "Content-Type" => "application/json" }
        expect(response).to have_http_status(:not_found)
      end
    end

    it "ログアウトすると、控えておいた Cookie の値でも、ログインした人として通らない" do
      patient = create(:patient, password: password)
      sign_in(:patient, patient)
      stolen = response.headers["Set-Cookie"].to_s[/_clinic_session=[^;]+/]
      expect(stolen).to be_present

      graphql(:patient, logout)
      cookies.delete("_clinic_session")

      expect(graphql(:patient, me, headers: { "Cookie" => stolen }).dig("data", "me")).to be_nil
      expect(Session.count).to eq(0)
    end

    it "ログインのたびに、セッションの合言葉が変わる。期限（12時間）を過ぎると、ログインが切れる" do
      patient = create(:patient, password: password)
      sign_in(:patient, patient)
      first = Session.sole.token_digest
      sign_in(:patient, patient)

      expect(Session.sole.token_digest).not_to eq(first)
      expect(viewer(:patient)["name"]).to eq(patient.name)

      Session.sole.update!(expires_at: Time.current - 1.second)
      expect(viewer(:patient)).to be_nil
    end

    it "メールアドレスは、大文字や前後の空白が混じっていてもログインできる" do
      patient = create(:patient, email: "taro@example.com", password: password)

      result = graphql(:patient, login, variables: { email: " Taro@Example.com ", password: password })

      expect(result.dig("data", "login", "viewer", "name")).to eq(patient.name)
    end

    it "パスワードが違うとき・メールアドレスがないときは、同じ INVALID_CREDENTIALS を返し、ログインしない" do
      patient = create(:patient, password: password)

      wrong_password = graphql(:patient, login, variables: { email: patient.email, password: "違う" })
      unknown_email = graphql(:patient, login, variables: { email: "nobody@example.com", password: password })

      expect(wrong_password.dig("data", "login")).to eq("viewer" => nil, "errors" => [ { "code" => "INVALID_CREDENTIALS" } ])
      expect(unknown_email.dig("data", "login")).to eq(wrong_password.dig("data", "login"))
      expect(viewer(:patient)).to be_nil
    end

    it "3つの画面のオリジンからの要求は通し、ほかのオリジンからの要求は 403 で断る" do
      %w[http://localhost:3000 http://localhost:3010 http://localhost:3020].each do |origin|
        graphql(:patient, me, headers: { "Origin" => origin })
        expect(response).to have_http_status(:ok)
      end

      graphql(:patient, me, headers: { "Origin" => "https://evil.example" })
      expect(response).to have_http_status(:forbidden)
    end

    it "JSON でない要求（HTML のフォームから送れる形）は 415 で断る" do
      post "/graphql/patient", params: { query: me }

      expect(response).to have_http_status(:unsupported_media_type)
    end
  end
end
