require "rails_helper"

RSpec.describe "監査ログ" do
  let(:now) { Time.zone.local(2030, 1, 7, 8, 50) }
  let(:slot) { create(:slot, starts_at: Time.zone.local(2030, 1, 7, 9)) }
  let(:clinic) { slot.clinic }
  let(:doctor) { slot.doctor }
  let(:clerk) { create(:clerk, clinic: clinic) }
  let(:admin) { create(:clerk, clinic: clinic, admin: true) }
  let(:patient) { create(:patient) }
  let!(:fee_item) { create(:fee_item, clinic: clinic) }
  let!(:question) { create(:questionnaire_question, clinic: clinic) }

  def actions = AuditLog.order(:id).pluck(:action)

  # 予約 → 問診 → 受付 → 診察 → 会計まで、ひととおり進める
  def run_whole_flow
    appointment = Appointments::Book.new(actor: patient, slot_id: slot.id, now: now).call.value
    Questionnaires::Save.new(actor: patient, appointment_id: appointment.id, answers: { question.id.to_s => "せき" }, submit: true, now: now).call
    Appointments::CheckIn.new(actor: patient, appointment_id: appointment.id, now: now).call
    Appointments::StartConsultation.new(actor: doctor, appointment_id: appointment.id, now: now).call
    Appointments::FinishConsultation.new(actor: doctor, appointment_id: appointment.id, now: now).call
    bill = appointment.reload.bill
    Bills::UpdateItems.new(actor: clerk, bill_id: bill.id, items: [ { fee_item_id: fee_item.id.to_s, quantity: 1 } ], now: now).call
    Bills::Confirm.new(actor: clerk, bill_id: bill.id, now: now).call
    Bills::Settle.new(actor: clerk, bill_id: bill.id, step: :pay, now: now).call
    Bills::Settle.new(actor: clerk, bill_id: bill.id, step: :refund, now: now).call
    appointment
  end

  it "変える操作のたびに、誰が・いつ・どの患者の・何を、が1件ずつ残る" do
    appointment = run_whole_flow

    expect(actions).to eq(%w[
      appointment.book questionnaire.save appointment.check_in appointment.start appointment.finish
      bill.update_items bill.confirm bill.pay bill.refund
    ])
    expect(AuditLog.distinct.pluck(:clinic_id, :patient_id, :occurred_at)).to eq([ [ clinic.id, patient.id, now ] ])
    expect(AuditLog.find_by(action: "appointment.start")).to have_attributes(
      actor_type: "StaffMember", actor_id: doctor.id, subject_type: "Appointment", subject_id: appointment.id
    )
    expect(AuditLog.find_by(action: "bill.confirm")).to have_attributes(actor_id: clerk.id, subject_type: "Bill", subject_id: appointment.bill.id)
  end

  it "キャンセルと時刻の変更も残る" do
    appointment = Appointments::Book.new(actor: patient, slot_id: slot.id, now: now - 1.day).call.value
    other = create(:slot, doctor: doctor, starts_at: slot.starts_at + 1.day)
    Appointments::Reschedule.new(actor: clerk, appointment_id: appointment.id, slot_id: other.id, now: now - 1.day).call
    Appointments::Cancel.new(actor: patient, appointment_id: appointment.id, now: now - 1.day).call

    expect(actions).to eq(%w[appointment.book appointment.reschedule appointment.cancel])
    expect(AuditLog.order(:id).pluck(:actor_type)).to eq(%w[Patient StaffMember Patient])
  end

  it "断られた操作は、残らない" do
    appointment = Appointments::Book.new(actor: patient, slot_id: slot.id, now: now).call.value
    Appointments::Book.new(actor: create(:patient), slot_id: slot.id, now: now).call
    Appointments::StartConsultation.new(actor: doctor, appointment_id: appointment.id, now: now).call
    Appointments::Cancel.new(actor: create(:patient), appointment_id: appointment.id, now: now).call

    expect(actions).to eq(%w[appointment.book])
  end

  it "記録が入れられなかったら、変更も入らない（同じトランザクション）" do
    appointment = Appointments::Book.new(actor: patient, slot_id: slot.id, now: now).call.value
    allow(Audit).to receive(:appointment).and_raise(ActiveRecord::StatementInvalid, "わざと失敗させる")

    expect { Appointments::CheckIn.new(actor: patient, appointment_id: appointment.id, now: now).call }.to raise_error(ActiveRecord::StatementInvalid)
    expect { Appointments::Cancel.new(actor: patient, appointment_id: appointment.id, now: now - 1.day).call }.to raise_error(ActiveRecord::StatementInvalid)
    expect(appointment.reload.status).to eq("booked")
  end

  it "診察の開始・会計の支払い済も、記録が入れられなかったら、変更が入らない" do
    appointment = create(:appointment, slot: slot, patient: patient, status: :checked_in, checked_in_at: now)
    bill = create(:bill, appointment: create(:appointment, slot: create(:slot, doctor: doctor, starts_at: slot.starts_at + 1.hour), status: :completed),
      clinic: clinic, status: :billed, total_amount: 100, billed_at: now)
    allow(Audit).to receive(:appointment).and_raise(ActiveRecord::StatementInvalid, "わざと失敗させる")
    allow(Audit).to receive(:bill).and_raise(ActiveRecord::StatementInvalid, "わざと失敗させる")

    expect { Appointments::StartConsultation.new(actor: doctor, appointment_id: appointment.id, now: now).call }.to raise_error(ActiveRecord::StatementInvalid)
    expect { Bills::Settle.new(actor: clerk, bill_id: bill.id, step: :pay, now: now).call }.to raise_error(ActiveRecord::StatementInvalid)
    expect(appointment.reload.status).to eq("checked_in")
    expect(bill.reload.status).to eq("billed")
  end

  it "無断キャンセルにする定期の処理も、システムがしたこととして、予約ごとに残る" do
    appointments = Array.new(2) { |i| create(:appointment, slot: create(:slot, doctor: doctor, starts_at: slot.starts_at - (i + 1).hours)) }
    checked_in = create(:appointment, slot: slot, status: :checked_in, checked_in_at: now)

    expect(Appointments::MarkNoShows.new(now: now + 1.day).call).to eq(2)

    expect(AuditLog.pluck(:action, :actor_type, :actor_id).uniq).to eq([ [ "appointment.no_show", "System", nil ] ])
    expect(AuditLog.pluck(:subject_id, :patient_id)).to match_array(appointments.map { |each| [ each.id, each.patient_id ] })
    expect(AuditLog.where(subject_id: checked_in.id)).to be_empty
    node = execute_graphql("{ auditLogs { edges { node { action actorKind actorName } } } }", user: admin, now: now).dig("data", "auditLogs", "edges", 0, "node")
    expect(node).to eq("action" => "APPOINTMENT_NO_SHOW", "actorKind" => nil, "actorName" => "システム（定期の処理）")
  end

  it "した人がシステムなのに id がある・人なのに id がない記録は、DB に入らない" do
    row = { clinic_id: clinic.id, action: "appointment.no_show", patient_id: patient.id, subject_type: "Appointment", subject_id: 1, occurred_at: now }

    [ { actor_type: "System", actor_id: 1 }, { actor_type: "Patient", actor_id: nil }, { actor_type: "Robot", actor_id: nil } ].each do |actor|
      expect { ActiveRecord::Base.transaction(requires_new: true) { AuditLog.insert!(row.merge(actor)) } }
        .to raise_error(ActiveRecord::StatementInvalid, /audit_logs_actor_check/)
    end
  end

  describe "見た、の記録" do
    let!(:appointment) { run_whole_flow }

    before { AuditLog.delete_all }

    it "問診の答えを読むと残る。提出済かどうかを見ただけでは、残らない" do
      execute_graphql("{ appointments { edges { node { questionnaire { submitted } } } } }", user: doctor, now: now)
      expect(actions).to eq([])

      execute_graphql("{ appointments { edges { node { questionnaire { answers { text } } } } } }", user: doctor, now: now)
      expect(AuditLog.sole).to have_attributes(
        action: "questionnaire.view", actor_type: "StaffMember", actor_id: doctor.id, patient_id: patient.id, subject_type: "QuestionnaireResponse"
      )
    end

    it "会計の明細を読むと残る。状態と合計だけ・見られない人が開いたときは、残らない" do
      query = "query($id: ID!) { bill(id: $id) { id items { name } } }"
      # 医師の入口には、会計の操作そのものが載っていない（test/graphql/schema_spec.rb）
      execute_graphql(query, variables: { id: appointment.bill.id.to_s }, user: create(:patient), now: now)
      execute_graphql(query, variables: { id: appointment.bill.id.to_s }, user: create(:clerk), now: now)
      execute_graphql("query($id: ID!) { bill(id: $id) { id status totalAmount } }", variables: { id: appointment.bill.id.to_s }, user: patient, now: now)
      expect(actions).to eq([])

      execute_graphql(query, variables: { id: appointment.bill.id.to_s }, user: patient, now: now)
      expect(AuditLog.sole).to have_attributes(action: "bill.view", actor_type: "Patient", actor_id: patient.id, subject_type: "Bill")
    end

    it "予約からたどって会計の明細を読んでも、残る" do
      execute_graphql("{ appointments { edges { node { bill { status } } } } }", user: clerk, now: now)
      expect(actions).to eq([])

      execute_graphql("{ appointments { edges { node { bill { items { name } } } } } }", user: clerk, now: now)
      expect(AuditLog.sole).to have_attributes(action: "bill.view", actor_type: "StaffMember", actor_id: clerk.id, patient_id: patient.id)
    end
  end

  describe "変えられない・消せない（アプリのコードから）" do
    let!(:log) do
      Appointments::Book.new(actor: patient, slot_id: slot.id, now: now).call
      AuditLog.sole
    end

    it "更新も削除も、例外になる（モデルを読み取り専用にしている）" do
      expect { log.update!(action: "bill.view") }.to raise_error(ActiveRecord::ReadOnlyRecord)
      expect { log.destroy! }.to raise_error(ActiveRecord::ReadOnlyRecord)
      expect(log.reload.action).to eq("appointment.book")
    end

    it "決めていない操作の名前は、入らない" do
      expect { Audit.record(actor: patient, action: "unknown", clinic_id: clinic.id, patient_id: patient.id, subject: log, now: now) }
        .to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "一覧（auditLogs）" do
    let(:query) do
      "query($first: Int, $after: String) { auditLogs(first: $first, after: $after) { edges { node { action actorKind actorName patientName subject occurredAt } } pageInfo { hasNextPage endCursor } } }"
    end

    def fetch(user, **variables) = execute_graphql(query, variables: variables, user: user, now: now).dig("data", "auditLogs")

    it "管理者の事務スタッフには、自院の分が、新しい順に出る" do
      appointment = run_whole_flow
      other = create(:appointment)
      Audit.appointment(actor: other.patient, action: "appointment.book", appointment: other, now: now)

      logs = fetch(admin)["edges"].map { |edge| edge["node"] }

      expect(logs.size).to eq(9)
      expect(logs.first).to eq(
        "action" => "BILL_REFUND", "actorKind" => "CLERK", "actorName" => clerk.name, "patientName" => patient.name,
        "subject" => "会計 ##{appointment.bill.id}", "occurredAt" => now.iso8601
      )
      expect(logs.last).to include("action" => "APPOINTMENT_BOOK", "actorKind" => "PATIENT", "actorName" => patient.name)
    end

    # 医師と患者の入口には、監査ログの操作そのものが載っていない（test/graphql/schema_spec.rb）
    it "管理者でない事務スタッフ・ほかの医療機関の管理者には、何も出ない" do
      run_whole_flow

      [ clerk, create(:clerk, admin: true) ].each do |user|
        expect(fetch(user)["edges"]).to eq([])
      end
    end

    it "管理者の印が付いていても、医師には、見られる範囲がない" do
      expect(AuditLogPolicy.scope(create(:doctor, clinic: clinic, admin: true))).to be_empty
      expect(AuditLogPolicy.scope(patient)).to be_empty
    end

    it "続きを読んでも、全部が1回ずつ、新しい順に出る。行が増えても SQL の本数は変わらない" do
      run_whole_flow
      first = fetch(admin, first: 4)
      second = fetch(admin, first: 10, after: first.dig("pageInfo", "endCursor"))
      expect((first["edges"] + second["edges"]).map { |edge| edge.dig("node", "action") }.size).to eq(9)
      expect(second.dig("pageInfo", "hasNextPage")).to be(false)

      few = count_queries { fetch(admin, first: 3) }
      many = count_queries { fetch(admin, first: 9) }
      expect(many).to eq(few)
    end
  end
end
