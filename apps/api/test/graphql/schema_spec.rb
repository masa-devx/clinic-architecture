require "rails_helper"

RSpec.describe "3つの入口のスキーマ" do
  def root_fields(schema, root) = schema.public_send(root).fields.keys.sort

  describe "正常系" do
    GraphqlController::SCHEMAS.each do |audience, schema|
      it "#{audience}: 書き出してあるスキーマが、今のスキーマと同じ（ずれていたら bin/rails graphql:dump を流す）" do
        expect(Rails.root.join("schema", "#{audience}.graphql").read).to eq(schema.to_definition)
      end
    end

    # どの入口に、どの操作が載っているか。載せる・外すは、ここも一緒に変える（意図せず増えたら、ここで気づく）
    it "患者の入口に載っているのは、患者の操作だけ" do
      expect(root_fields(PatientApi::Schema, :query)).to eq(%w[appointment appointments availableSlots bill clinic clinics me])
      expect(root_fields(PatientApi::Schema, :mutation)).to eq(
        %w[bookAppointment cancelAppointment checkIn login logout rescheduleAppointment saveQuestionnaire]
      )
    end

    it "事務スタッフの入口に載っているのは、事務スタッフの操作だけ" do
      expect(root_fields(ClerkApi::Schema, :query)).to eq(%w[appointment appointments auditLogs availableSlots bill dashboard feeItems me])
      expect(root_fields(ClerkApi::Schema, :mutation)).to eq(
        %w[bookAppointment cancelAppointment closeSlot confirmBill createSlots login logout markBillPaid refundBill rescheduleAppointment updateBillItems]
      )
    end

    it "医師の入口に載っているのは、医師の操作だけ" do
      expect(root_fields(DoctorApi::Schema, :query)).to eq(%w[appointment appointments availableSlots me])
      expect(root_fields(DoctorApi::Schema, :mutation)).to eq(%w[closeSlot createSlots finishConsultation login logout startConsultation])
    end
  end

  describe "異常系" do
    # 入口で絞っているが、resolver の中の役割の確かめも、守りとして残している。
    # 入口を取り違えた（医師を事務スタッフの入口で実行した）ときに、何も返さないことを確かめる
    it "事務スタッフの入口でも、事務スタッフでない人には、料金の表・ダッシュボード・監査ログは空" do
      doctor = create(:doctor, admin: true)
      create(:fee_item, clinic: doctor.clinic)
      query = '{ feeItems { id } dashboard(from: "2030-01-01", to: "2030-01-07") { total } auditLogs { edges { node { id } } } }'

      result = execute_graphql(query, user: doctor, audience: "clerk")

      expect(result["data"]).to eq("feeItems" => [], "dashboard" => [], "auditLogs" => { "edges" => [] })
    end

    it "ほかの入口の操作は、スキーマにないので、実行の前に断られる" do
      patient = create(:patient)

      result = execute_graphql("mutation { confirmBill(billId: \"1\") { errors { code } } }", user: patient, expect_errors: true)

      expect(result["errors"].first["message"]).to include("confirmBill")
      expect(result["data"]).to be_nil
    end

    it "監査ログ・料金の表・ダッシュボードの型は、患者と医師のスキーマに、型ごと載っていない" do
      [ PatientApi::Schema, DoctorApi::Schema ].each do |schema|
        expect(schema.types.keys).not_to include("AuditLog", "FeeItem", "DashboardRow")
      end
      expect(ClerkApi::Schema.types.keys).to include("AuditLog", "FeeItem", "DashboardRow")
    end

    it "想定していないエラーは、中身を出さずに INTERNAL で返し、ログに残す（どの入口でも）" do
      allow(Appointments::ListQuery).to receive(:new).and_raise(RuntimeError, "中の事情")
      allow(AppLog).to receive(:error)

      [ create(:patient), create(:clerk), create(:doctor) ].each do |user|
        result = execute_graphql("{ appointments { edges { node { id } } } }", user: user, expect_errors: true)

        expect(result["errors"].map { |error| error.dig("extensions", "code") }).to eq([ "INTERNAL" ])
        expect(result.to_json).not_to include("中の事情")
      end
      expect(AppLog).to have_received(:error).with("graphql.Query.appointments", hash_including(err: instance_of(RuntimeError))).exactly(3).times
    end

    it "重すぎるクエリは、実行する前に断る" do
      list = "appointments(first: 50) { edges { node { id status canCancel patient { name } slot { startsAt doctor { name } clinic { name doctors { name } } } } } }"
      one = "{ #{list} }"
      many = "{ #{(1..10).map { |n| "a#{n}: #{list}" }.join(' ')} }"
      clerk = create(:clerk)

      expect(execute_graphql(one, user: clerk).dig("data", "appointments", "edges")).to eq([])

      queries = count_queries do
        result = execute_graphql(many, user: clerk, expect_errors: true)
        expect(result["errors"].first["message"]).to match(/complexity/)
        expect(result["data"]).to be_nil
      end
      expect(queries).to eq(0)
    end
  end
end
