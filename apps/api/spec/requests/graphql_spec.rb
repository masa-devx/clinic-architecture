require "rails_helper"

# HTTP を通して確かめる（Cookie のセッション・Origin の確認）
RSpec.describe "POST /graphql", type: :request do
  let(:password) { "test-password" }
  let(:me) { "{ me { id kind name clinic { id } } }" }
  let(:patient_login) do
    "mutation($email: String!, $password: String!) { patientLogin(email: $email, password: $password) { viewer { kind name } errors { code } } }"
  end
  let(:staff_login) do
    "mutation($email: String!, $password: String!) { staffLogin(email: $email, password: $password) { viewer { kind name } errors { code } } }"
  end

  def graphql(query, variables: {}, headers: {})
    post "/graphql", params: { query: query, variables: variables }.to_json, headers: { "Content-Type" => "application/json" }.merge(headers)
    response.parsed_body
  end

  it "ログインすると Cookie でログインが続き、ログアウトすると切れる" do
    patient = create(:patient, password: password)
    expect(graphql(me).dig("data", "me")).to be_nil

    login = graphql(patient_login, variables: { email: patient.email, password: password })
    expect(login.dig("data", "patientLogin")).to eq("viewer" => { "kind" => "PATIENT", "name" => patient.name }, "errors" => [])
    expect(graphql(me).dig("data", "me")).to include("kind" => "PATIENT", "name" => patient.name, "clinic" => nil)

    graphql("mutation { logout { errors { code } } }")
    expect(graphql(me).dig("data", "me")).to be_nil
  end

  it "ログアウトすると、控えておいた Cookie の値でも、ログインした人として通らない" do
    patient = create(:patient, password: password)
    graphql(patient_login, variables: { email: patient.email, password: password })
    stolen = response.headers["Set-Cookie"].to_s[/_clinic_session=[^;]+/]
    expect(stolen).to be_present

    graphql("mutation { logout { errors { code } } }")
    cookies.delete("_clinic_session")

    expect(graphql(me, headers: { "Cookie" => stolen }).dig("data", "me")).to be_nil
    expect(Session.count).to eq(0)
  end

  it "ログインのたびに、セッションの合言葉が変わる。期限（12時間）を過ぎると、ログインが切れる" do
    patient = create(:patient, password: password)
    graphql(patient_login, variables: { email: patient.email, password: password })
    first = Session.sole.token_digest
    graphql(patient_login, variables: { email: patient.email, password: password })

    expect(Session.sole.token_digest).not_to eq(first)
    expect(graphql(me).dig("data", "me", "name")).to eq(patient.name)

    Session.sole.update!(expires_at: Time.current - 1.second)
    expect(graphql(me).dig("data", "me")).to be_nil
  end

  it "メールアドレスは、大文字や前後の空白が混じっていてもログインできる" do
    patient = create(:patient, email: "taro@example.com", password: password)

    login = graphql(patient_login, variables: { email: " Taro@Example.com ", password: password })

    expect(login.dig("data", "patientLogin", "viewer", "name")).to eq(patient.name)
  end

  it "パスワードが違うとき・メールアドレスがないときは、同じ INVALID_CREDENTIALS を返し、ログインしない" do
    patient = create(:patient, password: password)

    wrong_password = graphql(patient_login, variables: { email: patient.email, password: "違う" })
    unknown_email = graphql(patient_login, variables: { email: "nobody@example.com", password: password })

    expect(wrong_password.dig("data", "patientLogin")).to eq("viewer" => nil, "errors" => [ { "code" => "INVALID_CREDENTIALS" } ])
    expect(unknown_email.dig("data", "patientLogin")).to eq(wrong_password.dig("data", "patientLogin"))
    expect(graphql(me).dig("data", "me")).to be_nil
  end

  it "患者とスタッフは入口が別。スタッフの入口で患者はログインできず、その逆もできない" do
    patient = create(:patient, password: password)
    doctor = create(:doctor, password: password)

    expect(graphql(staff_login, variables: { email: patient.email, password: password }).dig("data", "staffLogin", "errors")).to eq([ { "code" => "INVALID_CREDENTIALS" } ])
    expect(graphql(patient_login, variables: { email: doctor.email, password: password }).dig("data", "patientLogin", "errors")).to eq([ { "code" => "INVALID_CREDENTIALS" } ])

    expect(graphql(staff_login, variables: { email: doctor.email, password: password }).dig("data", "staffLogin", "viewer")).to eq("kind" => "DOCTOR", "name" => doctor.name)
    expect(graphql(me).dig("data", "me")).to include("kind" => "DOCTOR", "clinic" => { "id" => doctor.clinic_id.to_s })
  end

  it "画面のオリジンからの要求は通し、ほかのオリジンからの要求は 403 で断る" do
    graphql(me, headers: { "Origin" => "http://localhost:3000" })
    expect(response).to have_http_status(:ok)

    graphql(me, headers: { "Origin" => "https://evil.example" })
    expect(response).to have_http_status(:forbidden)
  end

  it "JSON でない要求（HTML のフォームから送れる形）は 415 で断る" do
    post "/graphql", params: { query: me }

    expect(response).to have_http_status(:unsupported_media_type)
  end

  it "問診の答えを、リクエストのログに出さない" do
    patient = create(:patient, password: password)
    appointment = create(:appointment, patient: patient, slot: create(:slot, starts_at: Time.current + 1.day))
    question = create(:questionnaire_question, clinic: appointment.clinic)
    graphql(patient_login, variables: { email: patient.email, password: password })
    mutation = "mutation($id: ID!, $answers: [QuestionnaireAnswerInput!]!) { saveQuestionnaire(appointmentId: $id, answers: $answers, submit: false) { errors { code } } }"
    output = StringIO.new
    logger = ActiveSupport::Logger.new(output)

    Rails.logger.broadcast_to(logger)
    result = graphql(mutation, variables: { id: appointment.id.to_s, answers: [ { questionId: question.id.to_s, text: "だれにも言えない症状" } ] })
    Rails.logger.stop_broadcasting_to(logger)

    expect(result.dig("data", "saveQuestionnaire", "errors")).to eq([])
    expect(output.string).to include("saveQuestionnaire")
    expect(output.string).not_to include("だれにも言えない症状")
  end

  it "パスワードとメールアドレスを、リクエストのログに出さない" do
    patient = create(:patient, email: "secret-mail@example.com", password: password)
    output = StringIO.new
    logger = ActiveSupport::Logger.new(output)
    logger.formatter = Rails.logger.formatter

    Rails.logger.broadcast_to(logger)
    graphql(patient_login, variables: { email: patient.email, password: password })
    Rails.logger.stop_broadcasting_to(logger)

    expect(output.string).to include("[FILTERED]")
    expect(output.string).not_to include(password)
    expect(output.string).not_to include("secret-mail@example.com")
  end
end
