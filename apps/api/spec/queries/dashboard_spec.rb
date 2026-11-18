require "rails_helper"

RSpec.describe "ダッシュボード（日ごと・医師ごとの集計）" do
  let(:clinic) { create(:clinic) }
  let(:doctor_a) { create(:doctor, clinic: clinic) }
  let(:doctor_b) { create(:doctor, clinic: clinic) }
  let(:clerk) { create(:clerk, clinic: clinic) }
  let(:day7) { Date.new(2030, 1, 7) }

  let(:query) do
    "query($from: ISO8601Date!, $to: ISO8601Date!) { dashboard(from: $from, to: $to) { date doctor { id } total canceled noShow completed revenue } }"
  end

  def appointment_at(time, doctor: doctor_a, status: :booked, **attributes)
    extra = status == :canceled ? { canceled_at: time } : {}
    create(:appointment, slot: create(:slot, doctor: doctor, starts_at: time), status: status, **extra, **attributes)
  end

  def bill_for(appointment, status:, total:)
    create(:bill, appointment: appointment, clinic: clinic, status: status, total_amount: total, billed_at: Time.zone.local(2030, 1, 8))
  end

  def fetch(user: clerk, from: "2030-01-07", to: "2030-01-08", expect_errors: false)
    execute_graphql(query, variables: { from: from, to: to }, user: user, expect_errors: expect_errors)
  end

  def rows(**options) = fetch(**options).dig("data", "dashboard")

  it "日ごと・医師ごとに、件数と売上が出る。売上は、支払い済の会計だけ" do
    paid = appointment_at(Time.zone.local(2030, 1, 7, 9), status: :completed)
    bill_for(paid, status: :paid, total: 3_000)
    refunded = appointment_at(Time.zone.local(2030, 1, 7, 10), status: :completed)
    bill_for(refunded, status: :refunded, total: 5_000)
    billed = appointment_at(Time.zone.local(2030, 1, 7, 11), status: :completed)
    bill_for(billed, status: :billed, total: 7_000)
    appointment_at(Time.zone.local(2030, 1, 7, 12), status: :canceled)
    appointment_at(Time.zone.local(2030, 1, 7, 13), status: :no_show)
    appointment_at(Time.zone.local(2030, 1, 7, 14))
    appointment_at(Time.zone.local(2030, 1, 7, 9), doctor: doctor_b, status: :canceled)
    appointment_at(Time.zone.local(2030, 1, 8, 9))

    expect(rows).to eq([
      { "date" => "2030-01-07", "doctor" => { "id" => doctor_a.id.to_s }, "total" => 6, "canceled" => 1, "noShow" => 1, "completed" => 3, "revenue" => 3_000 },
      { "date" => "2030-01-07", "doctor" => { "id" => doctor_b.id.to_s }, "total" => 1, "canceled" => 1, "noShow" => 0, "completed" => 0, "revenue" => 0 },
      { "date" => "2030-01-08", "doctor" => { "id" => doctor_a.id.to_s }, "total" => 1, "canceled" => 0, "noShow" => 0, "completed" => 0, "revenue" => 0 }
    ])
  end

  it "日の区切りは日本時間。期間は、from と to の日を含む" do
    # 同じ医師の枠は時間が重ならない（30分の枠）ので、境目の前後は、医師を分けて置く
    appointment_at(Time.zone.local(2030, 1, 6, 23, 59), doctor: doctor_b)
    appointment_at(Time.zone.local(2030, 1, 7, 0, 0))
    appointment_at(Time.zone.local(2030, 1, 7, 23, 59))
    appointment_at(Time.zone.local(2030, 1, 8, 0, 0), doctor: doctor_b)

    expect(rows(from: "2030-01-07", to: "2030-01-07")).to eq([
      { "date" => "2030-01-07", "doctor" => { "id" => doctor_a.id.to_s }, "total" => 2, "canceled" => 0, "noShow" => 0, "completed" => 0, "revenue" => 0 }
    ])
  end

  it "ほかの医療機関の予約と売上は、入らない" do
    other = create(:appointment, slot: create(:slot, starts_at: Time.zone.local(2030, 1, 7, 9)), status: :completed)
    create(:bill, appointment: other, clinic: other.clinic, status: :paid, total_amount: 9_999, billed_at: Time.zone.local(2030, 1, 7))

    expect(rows).to eq([])
  end

  # 医師と患者の入口には、ダッシュボードの操作そのものが載っていない（spec/graphql/schema_spec.rb）
  it "ほかの医療機関の事務スタッフには、何も出ない" do
    appointment_at(Time.zone.local(2030, 1, 7, 9))

    expect(rows(user: create(:clerk))).to eq([])
    expect(rows.size).to eq(1)
  end

  it "期間は31日まで。32日・逆向きは、集計せずに断る" do
    expect(rows(from: "2030-01-01", to: "2030-01-31")).to eq([])

    [ %w[2030-01-01 2030-02-01], %w[2030-01-08 2030-01-07] ].each do |from, to|
      result = fetch(from: from, to: to, expect_errors: true)
      expect(result["errors"].map { |error| error.dig("extensions", "code") }).to eq([ "BAD_REQUEST" ])
    end
  end

  it "日と医師が増えても、SQL の本数は変わらない（集計1本と、医師のまとめ読み1本）" do
    appointment_at(Time.zone.local(2030, 1, 7, 9))
    rows
    few = count_queries { rows }
    5.times { |i| appointment_at(Time.zone.local(2030, 1, 8, 9 + i), doctor: create(:doctor, clinic: clinic)) }
    many = count_queries { expect(rows.size).to eq(6) }

    expect(many).to eq(few)
    expect(many).to eq(2)
  end
end
