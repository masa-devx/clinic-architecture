require "rails_helper"

RSpec.describe "予約とキャンセル（bookAppointment・cancelAppointment）" do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:slot) { create(:slot, starts_at: now + 1.day) }
  let(:patient) { create(:patient) }

  let(:book) do
    <<~GRAPHQL
      mutation($slotId: ID!) {
        bookAppointment(slotId: $slotId) {
          appointment { id status canCancel slot { id } patient { id } }
          errors { code field message }
        }
      }
    GRAPHQL
  end
  let(:cancel) do
    <<~GRAPHQL
      mutation($appointmentId: ID!) {
        cancelAppointment(appointmentId: $appointmentId) {
          appointment { id status canceledAt canCancel }
          errors { code field message }
        }
      }
    GRAPHQL
  end

  it "予約して、キャンセルできる" do
    booked = execute_graphql(book, variables: { slotId: slot.id.to_s }, user: patient, now: now).dig("data", "bookAppointment")
    expect(booked["errors"]).to eq([])
    expect(booked["appointment"]).to include("status" => "BOOKED", "canCancel" => true, "slot" => { "id" => slot.id.to_s })

    canceled = execute_graphql(cancel, variables: { appointmentId: booked.dig("appointment", "id") }, user: patient, now: now)
      .dig("data", "cancelAppointment")
    expect(canceled["errors"]).to eq([])
    expect(canceled["appointment"]).to include("status" => "CANCELED", "canCancel" => false, "canceledAt" => now.iso8601)
  end

  it "埋まっている枠は、appointment が null で、errors に SLOT_TAKEN が入る" do
    create(:appointment, slot: slot)

    result = execute_graphql(book, variables: { slotId: slot.id.to_s }, user: patient, now: now).dig("data", "bookAppointment")

    expect(result).to eq("appointment" => nil, "errors" => [
      { "code" => "SLOT_TAKEN", "field" => "slotId", "message" => "すでに埋まっています。ほかの枠を選んでください" }
    ])
  end

  it "ほかの患者の予約の id でキャンセルしようとしても、NOT_FOUND で、予約は変わらない" do
    appointment = create(:appointment, slot: slot)

    result = execute_graphql(cancel, variables: { appointmentId: appointment.id.to_s }, user: patient, now: now).dig("data", "cancelAppointment")

    expect(result["errors"].map { |error| error["code"] }).to eq([ "NOT_FOUND" ])
    expect(appointment.reload.status).to eq("booked")
  end

  it "期限を過ぎた予約は、患者には canCancel が false、事務スタッフには true" do
    appointment = create(:appointment, slot: slot, patient: patient)
    query = "{ appointments { edges { node { canCancel } } } }"
    late = slot.starts_at - 30.minutes

    as_patient = execute_graphql(query, user: patient, now: late)
    as_clerk = execute_graphql(query, user: create(:clerk, clinic: appointment.clinic), now: late)
    as_doctor = execute_graphql(query, user: slot.doctor, now: late)

    expect(as_patient.dig("data", "appointments", "edges", 0, "node", "canCancel")).to be(false)
    expect(as_clerk.dig("data", "appointments", "edges", 0, "node", "canCancel")).to be(true)
    expect(as_doctor.dig("data", "appointments", "edges", 0, "node", "canCancel")).to be(false)
  end

  it "ログインしていなければ、mutation は UNAUTHENTICATED で断る" do
    result = execute_graphql(book, variables: { slotId: slot.id.to_s }, user: nil, now: now, expect_errors: true)

    expect(result["errors"].map { |error| error.dig("extensions", "code") }).to eq([ "UNAUTHENTICATED" ])
    expect(Appointment.count).to eq(0)
  end
end
