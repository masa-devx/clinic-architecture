# typed: false

require "rails_helper"

RSpec.describe "事前問診" do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:slot) { create(:slot, starts_at: now + 1.day) }
  let(:clinic) { slot.clinic }
  let(:doctor) { slot.doctor }
  let(:clerk) { create(:clerk, clinic: clinic) }
  let(:patient) { create(:patient) }
  let!(:appointment) { create(:appointment, slot: slot, patient: patient) }
  let!(:symptom) { create(:questionnaire_question, clinic: clinic, position: 1, label: "症状", kind: :text, required: true) }
  let!(:since) { create(:questionnaire_question, clinic: clinic, position: 2, label: "いつから", kind: :single, options: %w[今日 先週], required: true) }
  let!(:others) { create(:questionnaire_question, clinic: clinic, position: 3, label: "ほかに", kind: :multiple, options: %w[発熱 せき]) }

  let(:complete) { { symptom => "のどが痛い", since => "先週", others => %w[せき] } }

  let(:query) do
    <<~GRAPHQL
      query($id: ID!) {
        appointment(id: $id) {
          canViewQuestionnaire canAnswerQuestionnaire
          questionnaireQuestions { id label kind options required }
          questionnaire { submitted answers { questionId label kind text selected } }
        }
      }
    GRAPHQL
  end

  # 「GraphQL を通して見える範囲」で使う。先に、問診を提出しておく
  shared_context "提出した問診がある" do
    before { save(complete, submit: true) }
  end

  def save(answers, submit:, actor: patient, at: now)
    Questionnaires::Save.new(actor: actor, appointment_id: appointment.id, answers: answers.transform_keys { |question| question.id.to_s }, submit: submit, now: at).call
  end

  def fields(result) = result.errors.map { |error| [ error.code, error.field ] }

  def fetch(user) = execute_graphql(query, variables: { id: appointment.id.to_s }, user: user, now: now).dig("data", "appointment")

  describe "正常系" do
    describe "保存と提出" do
      it "途中まで保存できる（必須が空でもよい）。あとで続きを書いて、提出できる" do
        expect(save({ symptom => "のどが痛い" }, submit: false)).to be_success
        response = QuestionnaireResponse.sole
        expect(response).to have_attributes(submitted_at: nil, appointment_id: appointment.id, clinic_id: clinic.id)
        expect(response.answers.map { |answer| answer["value"] }).to eq([ "のどが痛い", nil, nil ])

        expect(save(complete, submit: true)).to be_success
        expect(QuestionnaireResponse.sole.reload).to have_attributes(submitted_at: now)
        expect(QuestionnaireResponse.sole.answers.map { |answer| answer["value"] }).to eq([ "のどが痛い", "先週", %w[せき] ])
      end

      it "一度提出したら、直して保存しても、提出済のまま。提出の日時は変わらない" do
        save(complete, submit: true)
        save(complete.merge(symptom => "熱もある"), submit: false, at: now + 1.hour)

        expect(QuestionnaireResponse.sole).to have_attributes(submitted_at: now)
        expect(QuestionnaireResponse.sole.answers.first["value"]).to eq("熱もある")
      end

      it "質問をあとで変えても、保存してある問診は、答えたときの質問のまま" do
        save(complete, submit: true)
        symptom.update!(label: "お困りのこと")
        since.update!(options: %w[今日])

        expect(QuestionnaireResponse.sole.answers.map { |answer| answer.values_at("label", "options", "value") }.first(2))
          .to eq([ [ "症状", [], "のどが痛い" ], [ "いつから", %w[今日 先週], "先週" ] ])
      end
    end

    describe "暗号と、ログ" do
      it "DB に入っている中身は暗号文で、答えも質問の文も、そのままでは読めない" do
        save(complete, submit: true)

        raw = QuestionnaireResponse.connection.select_value("SELECT payload FROM questionnaire_responses")
        expect(raw).not_to include("のどが痛い")
        expect(raw).not_to include("症状")
        expect(raw.encode("UTF-8")).not_to include("先週")
        expect(QuestionnaireResponse.sole.payload).to include("のどが痛い")
      end

      it "inspect に、中身を出さない" do
        save(complete, submit: true)

        expect(QuestionnaireResponse.sole.inspect).not_to include("のどが痛い")
        expect(QuestionnaireResponse.sole.inspect).to include("appointment_id: #{appointment.id}")
      end
    end

    describe "GraphQL を通して見える範囲" do
      include_context "提出した問診がある"

      it "患者本人には、質問と答えが見え、答えられる" do
        expect(fetch(patient)).to include("canViewQuestionnaire" => true, "canAnswerQuestionnaire" => true)
        expect(fetch(patient).dig("questionnaire", "answers")).to eq([
          { "questionId" => symptom.id.to_s, "label" => "症状", "kind" => "TEXT", "text" => "のどが痛い", "selected" => nil },
          { "questionId" => since.id.to_s, "label" => "いつから", "kind" => "SINGLE", "text" => "先週", "selected" => nil },
          { "questionId" => others.id.to_s, "label" => "ほかに", "kind" => "MULTIPLE", "text" => nil, "selected" => %w[せき] }
        ])
        expect(fetch(patient)["questionnaireQuestions"].map { |question| question["label"] }).to eq(%w[症状 いつから ほかに])
      end

      it "担当の医師には、答えが見えるが、答えられない" do
        expect(fetch(doctor)).to include("canViewQuestionnaire" => true, "canAnswerQuestionnaire" => false)
        expect(fetch(doctor).dig("questionnaire", "submitted")).to be(true)
      end
    end

    it "一覧に問診を足しても、行が増えて SQL の本数は変わらない" do
      # 答えも読む（「見た」の記録が、行ごとに SQL を出さないことも確かめる）
      list = "{ appointments { edges { node { id canViewQuestionnaire questionnaire { submitted answers { text } } questionnaireQuestions { id } } } } }"
      make = lambda do |i|
        each = create(:appointment, slot: create(:slot, doctor: doctor, starts_at: now + (i + 2).days), patient: patient)
        Questionnaires::Save.new(actor: patient, appointment_id: each.id, answers: complete.transform_keys { |question| question.id.to_s }, submit: true, now: now).call
      end
      2.times(&make)
      execute_graphql(list, user: patient, now: now)
      few = count_queries { execute_graphql(list, user: patient, now: now) }
      5.times { |i| make.call(i + 2) }
      many = count_queries { expect(execute_graphql(list, user: patient, now: now).dig("data", "appointments", "edges").size).to eq(8) }

      expect(many).to eq(few)
    end
  end

  describe "異常系" do
    describe "保存と提出" do
      it "提出のとき、悪い所を、質問ごとに、まとめて返す。何も保存しない" do
        result = save({ symptom => "", since => "きのう", others => %w[せき 腹痛] }, submit: true)

        expect(fields(result)).to eq([
          [ "INVALID_INPUT", "answers.#{symptom.id}" ], [ "INVALID_INPUT", "answers.#{since.id}" ], [ "INVALID_INPUT", "answers.#{others.id}" ]
        ])
        expect(result.errors.first.message).to eq("症状: 答えを入れてください")
        expect(QuestionnaireResponse.count).to eq(0)
      end

      it "途中まで保存でも、選択肢にない答え・長すぎる文章は断る" do
        expect(fields(save({ since => "きのう" }, submit: false))).to eq([ [ "INVALID_INPUT", "answers.#{since.id}" ] ])
        expect(fields(save({ symptom => "あ" * 1001 }, submit: false))).to eq([ [ "INVALID_INPUT", "answers.#{symptom.id}" ] ])
        expect(save({ symptom => "あ" * 1000 }, submit: false)).to be_success
      end

      it "複数選択は、同じ選択肢を2回入れられない。型が違う答えも断る" do
        expect(fields(save({ others => %w[せき せき] }, submit: false))).to eq([ [ "INVALID_INPUT", "answers.#{others.id}" ] ])
        expect(fields(save({ others => "せき" }, submit: false))).to eq([ [ "INVALID_INPUT", "answers.#{others.id}" ] ])
        expect(fields(save({ symptom => %w[a] }, submit: false))).to eq([ [ "INVALID_INPUT", "answers.#{symptom.id}" ] ])
      end

      it "提出したあとは、「途中まで保存」でも、必須を空にできない。提出の前なら、空で保存できる" do
        expect(save({ since => "先週" }, submit: false)).to be_success
        save(complete, submit: true)

        result = save(complete.merge(symptom => ""), submit: false)

        expect(fields(result)).to eq([ [ "INVALID_INPUT", "answers.#{symptom.id}" ] ])
        expect(QuestionnaireResponse.sole.answers.first["value"]).to eq("のどが痛い")
      end

      it "空白だけの文章は、答えがないものとして扱う" do
        expect(fields(save(complete.merge(symptom => " 　\n"), submit: true))).to eq([ [ "INVALID_INPUT", "answers.#{symptom.id}" ] ])
      end

      it "監査ログの記録が入れられなかったら、問診も保存されない（同じトランザクション）" do
        allow(Audit).to receive(:record).and_raise(ActiveRecord::StatementInvalid, "わざと失敗させる")

        expect { save(complete, submit: true) }.to raise_error(ActiveRecord::StatementInvalid)
        expect(QuestionnaireResponse.count).to eq(0)
      end

      it "2つの画面から同時に最初の保存が来て、片方が UNIQUE に当たったら、CONFLICT を返す" do
        save(complete, submit: false)
        # 「まだない」と判断して作ろうとした側を再現する（もう片方が、先に作り終えている）
        allow(QuestionnaireResponse).to receive(:find_or_initialize_by)
          .and_return(QuestionnaireResponse.new(appointment_id: appointment.id, clinic_id: clinic.id))

        expect(save(complete, submit: false).errors.map(&:code)).to eq([ "CONFLICT" ])
        expect(QuestionnaireResponse.count).to eq(1)
      end

      it "ほかの医療機関の質問の id で答えを送っても、無視される" do
        foreign = create(:questionnaire_question, label: "他院の質問")

        save(complete.merge(foreign => "x"), submit: true)

        expect(QuestionnaireResponse.sole.answers.map { |answer| answer["label"] }).to eq(%w[症状 いつから ほかに])
      end
    end

    describe "誰が答えられるか" do
      it "ほかの患者には NOT_FOUND。医師と事務スタッフは、答えられない" do
        expect(fields(save(complete, submit: true, actor: create(:patient)))).to eq([ [ "NOT_FOUND", "appointmentId" ] ])
        expect(save(complete, submit: true, actor: doctor).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
        expect(save(complete, submit: true, actor: clerk).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
        expect(QuestionnaireResponse.count).to eq(0)
      end

      it "受付済までは答えられる。診察が始まったあと・キャンセルしたあとは、答えられない" do
        appointment.update!(status: :checked_in, checked_in_at: now)
        expect(save(complete, submit: true)).to be_success

        appointment.update!(status: :in_consultation, started_at: now)
        expect(save(complete, submit: false).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
        appointment.update!(status: :canceled, canceled_at: now)
        expect(save(complete, submit: false).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
      end
    end

    # 本当に別々の接続でコミットしないと確かめられないので、トランザクションで包まない
    describe "保存と、診察の開始が、同時に来たとき" do
      self.use_transactional_tests = false

      after do
        [ AuditLog, OutboxMessage, QuestionnaireResponse, Appointment, Slot, QuestionnaireQuestion, Patient, StaffMember, Clinic ].each(&:delete_all)
      end

      it "保存が終わるまで、診察の開始は待つ（診察が始まったあとに、問診が書き換わらない）" do
        appointment.update!(status: :checked_in, checked_in_at: now)
        inside = Queue.new
        go = Queue.new
        # 保存の途中（予約を読んで、答えを確かめている所）で止める
        allow(Questionnaires::Validator).to receive(:errors) do
          inside << true
          go.pop
          []
        end

        saving = Thread.new { ActiveRecord::Base.connection_pool.with_connection { save(complete, submit: true) } }
        inside.pop
        starting = Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            Appointments::StartConsultation.new(actor: doctor, appointment_id: appointment.id, now: now).call
          end
        end
        sleep 0.5
        # 保存が予約の行をロックしているので、診察の開始は、まだ終わっていない
        expect(starting).to be_alive
        expect(appointment.reload.status).to eq("checked_in")

        go << true
        expect(saving.value).to be_success
        expect(starting.value).to be_success
        expect(appointment.reload.status).to eq("in_consultation")
        # 診察が始まったあとの保存は、断られる
        expect(save(complete, submit: false).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
      end
    end

    describe "GraphQL を通して見える範囲" do
      include_context "提出した問診がある"

      it "事務スタッフには、予約は見えるが、問診は、答えも質問も見えない" do
        expect(fetch(clerk)).to eq(
          "canViewQuestionnaire" => false, "canAnswerQuestionnaire" => false, "questionnaireQuestions" => [], "questionnaire" => nil
        )
      end

      it "ほかの患者・担当でない医師・ほかの医療機関の人には、予約ごと見えない" do
        [ create(:patient), create(:doctor, clinic: clinic), create(:clerk), create(:doctor) ].each do |user|
          expect(fetch(user)).to be_nil
        end
      end

      it "saveQuestionnaire の入力のエラーは、質問ごとに、まとめて返る" do
        mutation = <<~GRAPHQL
          mutation($id: ID!, $answers: [QuestionnaireAnswerInput!]!) {
            saveQuestionnaire(appointmentId: $id, answers: $answers, submit: true) {
              appointment { questionnaire { submitted } }
              errors { code field message }
            }
          }
        GRAPHQL
        answers = [ { questionId: since.id.to_s, text: "きのう" }, { questionId: others.id.to_s, selected: %w[せき] } ]

        result = execute_graphql(mutation, variables: { id: appointment.id.to_s, answers: answers }, user: patient, now: now).dig("data", "saveQuestionnaire")

        expect(result["appointment"]).to be_nil
        expect(result["errors"].map { |error| error["field"] }).to eq([ "answers.#{symptom.id}", "answers.#{since.id}" ])
      end
    end
  end
end
