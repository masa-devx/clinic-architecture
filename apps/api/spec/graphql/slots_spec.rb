require "rails_helper"

RSpec.describe "診療枠（availableSlots・createSlots）" do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:doctor) { create(:doctor) }
  let(:patient) { create(:patient) }

  let(:query) do
    <<~GRAPHQL
      query($clinicId: ID!, $doctorId: ID, $from: ISO8601Date, $to: ISO8601Date, $first: Int, $after: String) {
        availableSlots(clinicId: $clinicId, doctorId: $doctorId, from: $from, to: $to, first: $first, after: $after) {
          edges { node { id startsAt endsAt doctor { id name } } }
          pageInfo { hasNextPage endCursor }
        }
      }
    GRAPHQL
  end

  def available_ids(**variables)
    result = execute_graphql(query, variables: { clinicId: doctor.clinic_id.to_s, **variables }, user: patient, now: now)
    result.dig("data", "availableSlots", "edges").map { |edge| edge.dig("node", "id").to_i }
  end

  it "これからの枠で、有効な予約がないものだけが、開始時刻の順で出る" do
    free = create(:slot, doctor: doctor, starts_at: now + 2.days)
    booked = create(:slot, doctor: doctor, starts_at: now + 1.day)
    create(:appointment, slot: booked)
    canceled = create(:slot, doctor: doctor, starts_at: now + 3.hours)
    create(:appointment, :canceled, slot: canceled)
    create(:slot, doctor: doctor, starts_at: now) # ちょうど今に始まる枠は出ない
    create(:slot, starts_at: now + 1.day) # ほかの医療機関の枠

    expect(available_ids).to eq([ canceled.id, free.id ])
  end

  it "医師と日付（日本時間。from と to の日を含む）で絞れる" do
    other_doctor = create(:doctor, clinic: doctor.clinic)
    day7 = create(:slot, doctor: doctor, starts_at: Time.zone.local(2030, 1, 7, 23, 30))
    day8 = create(:slot, doctor: other_doctor, starts_at: Time.zone.local(2030, 1, 8, 0, 0))

    expect(available_ids(from: "2030-01-07", to: "2030-01-07")).to eq([ day7.id ])
    expect(available_ids(from: "2030-01-08")).to eq([ day8.id ])
    expect(available_ids(doctorId: other_doctor.id.to_s)).to eq([ day8.id ])
  end

  it "行が増えても、SQL の本数は変わらない（N+1 を出さない）" do
    2.times { create(:slot, doctor: create(:doctor, clinic: doctor.clinic), starts_at: now + 1.day) }
    available_ids # 1回目だけ出る準備の SQL を、数える前に済ませる
    few = count_queries { available_ids }
    8.times { create(:slot, doctor: create(:doctor, clinic: doctor.clinic), starts_at: now + 1.day) }
    many = count_queries { expect(available_ids.size).to eq(10) }

    expect(many).to eq(few)
    # 枠・医師の2本
    expect(many).to eq(2)
  end

  describe "createSlots" do
    let(:mutation) do
      <<~GRAPHQL
        mutation($input: CreateSlotsInput!) {
          createSlots(input: $input) { createdCount skippedCount errors { code field message } }
        }
      GRAPHQL
    end
    let(:input) do
      { doctorId: doctor.id.to_s, from: "2030-01-07", to: "2030-01-07", weekdays: [ 1 ], startTime: "09:00", endTime: "10:00", slotMinutes: 30 }
    end

    it "医師が自分の枠を作ると、空いている枠として出る" do
      result = execute_graphql(mutation, variables: { input: input }, user: doctor, now: now)

      expect(result.dig("data", "createSlots")).to eq("createdCount" => 2, "skippedCount" => 0, "errors" => [])
      expect(available_ids.size).to eq(2)
    end

    it "入力の誤りは、結果の errors に、コードと項目つきで入る" do
      result = execute_graphql(mutation, variables: { input: input.merge(endTime: "08:00") }, user: doctor, now: now)

      expect(result.dig("data", "createSlots")).to include("createdCount" => nil, "errors" => [ include("code" => "INVALID_INPUT", "field" => "endTime") ])
    end

    it "患者には作れない" do
      result = execute_graphql(mutation, variables: { input: input }, user: patient, now: now)

      expect(result.dig("data", "createSlots", "errors").map { |error| error["code"] }).to eq([ "NOT_PERMITTED" ])
      expect(Slot.count).to eq(0)
    end
  end
end
