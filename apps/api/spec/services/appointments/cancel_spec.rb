require "rails_helper"

RSpec.describe Appointments::Cancel do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:slot) { create(:slot, starts_at: now + 1.day) }
  let(:patient) { create(:patient) }
  let!(:appointment) { create(:appointment, slot: slot, patient: patient) }

  def cancel(actor:, at: now, appointment_id: appointment.id)
    described_class.new(actor: actor, appointment_id: appointment_id, now: at).call
  end

  it "患者は、自分の予約をキャンセルできる。キャンセルした日時が残る" do
    result = cancel(actor: patient)

    expect(result).to be_success
    expect(appointment.reload).to have_attributes(status: "canceled", canceled_at: now)
  end

  it "キャンセルした枠は、ほかの患者が予約できる" do
    cancel(actor: patient)

    expect(Appointments::Book.new(actor: create(:patient), slot_id: slot.id, now: now).call).to be_success
  end

  it "患者は、開始の1時間前ちょうどまでキャンセルでき、それを1秒過ぎるとできない" do
    late = cancel(actor: patient, at: slot.starts_at - 1.hour + 1.second)
    expect(late.errors.map(&:code)).to eq([ "CANCEL_DEADLINE_PASSED" ])
    expect(appointment.reload.status).to eq("booked")

    expect(cancel(actor: patient, at: slot.starts_at - 1.hour)).to be_success
  end

  it "事務スタッフは、自院の予約を、患者の期限を過ぎても、開始の前ならキャンセルできる" do
    expect(cancel(actor: create(:clerk, clinic: slot.clinic), at: slot.starts_at - 1.minute)).to be_success
  end

  it "事務スタッフも、開始の時刻を過ぎた予約はキャンセルできない" do
    result = cancel(actor: create(:clerk, clinic: slot.clinic), at: slot.starts_at)

    expect(result.errors.map(&:code)).to eq([ "CANCEL_DEADLINE_PASSED" ])
    expect(appointment.reload.status).to eq("booked")
  end

  # P1-3: 決まりを確かめたあと、更新する前に、ほかの操作で状態が変わった場合。更新の条件（今も予約済なら）が守る
  it "確かめたあとに、ほかの操作で状態が変わっていたら、上書きせずに INVALID_STATE を返す" do
    allow(Appointments::CancellationRule).to receive(:violation) do
      Appointment.where(id: appointment.id).update_all(status: "in_consultation")
      nil
    end

    result = cancel(actor: patient)

    expect(result.errors.map(&:code)).to eq([ "INVALID_STATE" ])
    expect(appointment.reload).to have_attributes(status: "in_consultation", canceled_at: nil)
  end

  it "すでにキャンセルした予約は INVALID_STATE" do
    cancel(actor: patient)

    expect(cancel(actor: patient).errors.map(&:code)).to eq([ "INVALID_STATE" ])
  end

  it "ほかの患者の予約は、あっても NOT_FOUND" do
    expect(cancel(actor: create(:patient)).errors.map(&:code)).to eq([ "NOT_FOUND" ])
    expect(appointment.reload.status).to eq("booked")
  end

  it "ほかの医療機関の事務スタッフには、あっても NOT_FOUND" do
    expect(cancel(actor: create(:clerk)).errors.map(&:code)).to eq([ "NOT_FOUND" ])
    expect(appointment.reload.status).to eq("booked")
  end

  it "担当の医師は、見られるがキャンセルできない（NOT_PERMITTED）" do
    expect(cancel(actor: slot.doctor).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
    expect(appointment.reload.status).to eq("booked")
  end

  it "同じ医療機関でも、担当でない医師には NOT_FOUND" do
    expect(cancel(actor: create(:doctor, clinic: slot.clinic)).errors.map(&:code)).to eq([ "NOT_FOUND" ])
  end
end
