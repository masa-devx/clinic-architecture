require "rails_helper"

# 受付 → 診察の開始 → 診察の終了（会計の下書きができる）と、無断キャンセル
RSpec.describe "受付から診察の終了まで" do
  let(:starts_at) { Time.zone.local(2030, 1, 7, 9) }
  let(:slot) { create(:slot, starts_at: starts_at) }
  let(:doctor) { slot.doctor }
  let(:patient) { create(:patient) }
  let!(:appointment) { create(:appointment, slot: slot, patient: patient) }

  def check_in(actor: patient, at: starts_at - 10.minutes)
    Appointments::CheckIn.new(actor: actor, appointment_id: appointment.id, now: at).call
  end

  def start(actor: doctor, at: starts_at)
    Appointments::StartConsultation.new(actor: actor, appointment_id: appointment.id, now: at).call
  end

  def finish(actor: doctor, at: starts_at + 20.minutes)
    Appointments::FinishConsultation.new(actor: actor, appointment_id: appointment.id, now: at).call
  end

  def codes(result) = result.errors.map(&:code)

  it "受付 → 開始 → 終了と進み、それぞれの日時が残り、会計の下書きが1つできる" do
    expect(check_in).to be_success
    expect(start).to be_success
    expect(finish).to be_success

    expect(appointment.reload).to have_attributes(
      status: "completed", checked_in_at: starts_at - 10.minutes, started_at: starts_at, completed_at: starts_at + 20.minutes
    )
    expect(appointment.bill).to have_attributes(status: "draft", clinic_id: appointment.clinic_id, total_amount: nil)
  end

  describe "受付" do
    it "開始の30分前ちょうどから、開始の15分後ちょうどまで、受付できる" do
      expect(codes(check_in(at: starts_at - 30.minutes - 1.second))).to eq([ "OUTSIDE_TIME_WINDOW" ])
      expect(codes(check_in(at: starts_at + 15.minutes + 1.second))).to eq([ "OUTSIDE_TIME_WINDOW" ])
      expect(appointment.reload.status).to eq("booked")

      expect(check_in(at: starts_at - 30.minutes)).to be_success
    end

    it "開始の15分後ちょうどでも、受付できる" do
      expect(check_in(at: starts_at + 15.minutes)).to be_success
    end

    it "時間を確かめたあとに、時刻の変更で別の枠になっていたら、受付にしない" do
      later = create(:slot, doctor: doctor, starts_at: starts_at + 7.days)
      allow(Appointments::ConsultationRule).to receive(:check_in_violation) do
        Appointment.where(id: appointment.id).update_all(slot_id: later.id)
        nil
      end

      expect(codes(check_in)).to eq([ "INVALID_STATE" ])
      expect(appointment.reload).to have_attributes(status: "booked", slot_id: later.id)
    end

    it "2回は受付できない" do
      check_in

      expect(codes(check_in)).to eq([ "INVALID_STATE" ])
    end

    it "ほかの患者には NOT_FOUND。事務スタッフと医師は、見えるが受付できない" do
      expect(codes(check_in(actor: create(:patient)))).to eq([ "NOT_FOUND" ])
      expect(codes(check_in(actor: create(:clerk, clinic: slot.clinic)))).to eq([ "NOT_PERMITTED" ])
      expect(codes(check_in(actor: doctor))).to eq([ "NOT_PERMITTED" ])
    end
  end

  describe "診察の開始と終了" do
    it "受付していない予約は、始められない" do
      expect(codes(start)).to eq([ "INVALID_STATE" ])
    end

    it "始めていない予約は、終えられない。会計もできない" do
      check_in

      expect(codes(finish)).to eq([ "INVALID_STATE" ])
      expect(Bill.count).to eq(0)
    end

    it "終了を2回押しても、会計は1つだけ" do
      check_in
      start
      finish

      expect(codes(finish)).to eq([ "INVALID_STATE" ])
      expect(Bill.where(appointment: appointment).count).to eq(1)
    end

    it "担当でない医師には NOT_FOUND。事務スタッフと患者は、見えるが始められない・終えられない" do
      check_in

      expect(codes(start(actor: create(:doctor, clinic: slot.clinic)))).to eq([ "NOT_FOUND" ])
      expect(codes(start(actor: create(:clerk, clinic: slot.clinic)))).to eq([ "NOT_PERMITTED" ])
      expect(codes(start(actor: patient))).to eq([ "NOT_PERMITTED" ])
      start
      expect(codes(finish(actor: create(:clerk, clinic: slot.clinic)))).to eq([ "NOT_PERMITTED" ])
      expect(appointment.reload.status).to eq("in_consultation")
    end

    it "事務スタッフは、受付済の予約をキャンセルできる。患者はできない。診察中は誰もできない" do
      check_in
      at = starts_at + 5.minutes

      expect(codes(Appointments::Cancel.new(actor: patient, appointment_id: appointment.id, now: at).call)).to eq([ "INVALID_STATE" ])
      other = create(:appointment, slot: create(:slot, doctor: doctor, starts_at: starts_at + 1.hour), status: :in_consultation)
      clerk = create(:clerk, clinic: slot.clinic)
      expect(codes(Appointments::Cancel.new(actor: clerk, appointment_id: other.id, now: at).call)).to eq([ "INVALID_STATE" ])

      expect(Appointments::Cancel.new(actor: clerk, appointment_id: appointment.id, now: at).call).to be_success
      expect(appointment.reload.status).to eq("canceled")
    end
  end

  describe "無断キャンセル（定期の処理）" do
    def mark(at:, **options) = Appointments::MarkNoShows.new(now: at, **options).call

    it "開始から15分を過ぎた「予約済」だけを、無断キャンセルにする" do
      expect(mark(at: starts_at + 15.minutes)).to eq(0)
      expect(appointment.reload.status).to eq("booked")

      expect(mark(at: starts_at + 15.minutes + 1.second)).to eq(1)
      expect(appointment.reload).to have_attributes(status: "no_show", no_show_at: starts_at + 15.minutes + 1.second)
    end

    it "受付済・キャンセルの予約は、そのまま" do
      check_in
      canceled = create(:appointment, :canceled, slot: create(:slot, doctor: doctor, starts_at: starts_at - 1.hour))

      expect(mark(at: starts_at + 1.day)).to eq(0)
      expect(appointment.reload.status).to eq("checked_in")
      expect(canceled.reload.status).to eq("canceled")
    end

    it "件数が、1回に更新する数より多くても、全部を無断キャンセルにする" do
      4.times { |i| create(:appointment, slot: create(:slot, doctor: doctor, starts_at: starts_at - (i + 1).hours)) }

      expect(mark(at: starts_at + 1.day, batch_size: 2)).to eq(5)
      expect(Appointment.where(status: "no_show").count).to eq(5)
    end

    it "無断キャンセルになった予約は、受付できない" do
      mark(at: starts_at + 16.minutes)

      expect(codes(check_in(at: starts_at + 14.minutes))).to eq([ "INVALID_STATE" ])
    end
  end
end
