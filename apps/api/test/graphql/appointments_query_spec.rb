require "rails_helper"

RSpec.describe "予約の一覧（appointments）" do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:clinic) { create(:clinic) }
  let(:doctor) { create(:doctor, clinic: clinic) }
  let(:clerk) { create(:clerk, clinic: clinic) }

  let(:query) do
    <<~GRAPHQL
      query($first: Int, $after: String, $filter: AppointmentFilter, $descending: Boolean) {
        appointments(first: $first, after: $after, filter: $filter, descending: $descending) {
          edges {
            cursor
            node {
              id status canCancel
              patient { id name }
              slot { id startsAt doctor { id name } clinic { id name } }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    GRAPHQL
  end

  # 医療機関ごとの分離で使う、自院の予約と、ほかの医療機関の予約
  shared_context "自院とほかの医療機関に予約がある" do
    let!(:mine) { appointment_at(now + 1.day) }
    let!(:other_clinic) { create(:appointment) }
  end

  # 絞り込みで使う、3日に分かれた予約
  shared_context "3日に分かれた予約がある" do
    let!(:day1) { appointment_at(Time.zone.local(2030, 1, 7, 9)) }
    let!(:day2_canceled) { appointment_at(Time.zone.local(2030, 1, 8, 23, 59), status: :canceled, canceled_at: now) }
    let!(:day3) { appointment_at(Time.zone.local(2030, 1, 9, 0, 0), doctor: create(:doctor, clinic: clinic)) }
  end

  # 続きの読み込み（カーソル）で使う、5件の予約
  shared_context "続けて読む予約が5件ある" do
    # 同じ開始時刻の予約が並んでも順番が決まることを確かめるために、医師を変えて同じ時刻にする
    let!(:appointments) do
      times = [ now + 1.day, now + 1.day, now + 1.day, now + 2.days, now + 3.days ]
      times.map { |starts_at| appointment_at(starts_at, doctor: create(:doctor, clinic: clinic)) }
    end
  end

  def appointment_at(starts_at, doctor: self.doctor, **attributes)
    create(:appointment, slot: create(:slot, doctor: doctor, starts_at: starts_at), **attributes)
  end

  def fetch(user:, **variables)
    execute_graphql(query, variables: variables, user: user, now: now).dig("data", "appointments")
  end

  def ids(connection) = connection["edges"].map { |edge| edge.dig("node", "id").to_i }

  def cursor(*values) = Base64.urlsafe_encode64(JSON.generate(values))

  describe "正常系" do
    it "事務スタッフは、自院の予約を、枠の開始時刻の順で見られる" do
      later = appointment_at(now + 2.days)
      earlier = appointment_at(now + 1.day)

      connection = fetch(user: clerk)

      expect(ids(connection)).to eq([ earlier.id, later.id ])
      expect(connection["edges"].first["node"]).to include(
        "status" => "BOOKED", "canCancel" => true,
        "patient" => { "id" => earlier.patient_id.to_s, "name" => earlier.patient.name }
      )
    end

    describe "絞り込み" do
      include_context "3日に分かれた予約がある"

      it "医師と状態で絞れる" do
        expect(ids(fetch(user: clerk, filter: { doctorId: doctor.id.to_s }))).to eq([ day1.id, day2_canceled.id ])
        expect(ids(fetch(user: clerk, filter: { status: "CANCELED" }))).to eq([ day2_canceled.id ])
      end

      it "新しい順にもできる" do
        expect(ids(fetch(user: clerk, descending: true))).to eq([ day3.id, day2_canceled.id, day1.id ])
      end
    end

    describe "続きの読み込み（カーソル）" do
      include_context "続けて読む予約が5件ある"

      it "2件ずつ読むと、全部が1回ずつ、順番どおりに出る" do
        seen = []
        after = nil
        3.times do
          connection = fetch(user: clerk, first: 2, after: after)
          seen.concat(ids(connection))
          after = connection.dig("pageInfo", "endCursor")
          break unless connection.dig("pageInfo", "hasNextPage")
        end

        expect(seen).to eq(appointments.map(&:id))
      end

      it "新しい順でも、2件ずつ読むと、全部が1回ずつ、順番どおりに出る" do
        seen = []
        after = nil
        3.times do
          connection = fetch(user: clerk, first: 2, after: after, descending: true)
          seen.concat(ids(connection))
          after = connection.dig("pageInfo", "endCursor")
          break unless connection.dig("pageInfo", "hasNextPage")
        end

        expect(seen).to eq(appointments.map(&:id).reverse)
      end

      it "first を付けなければ、20件" do
        other_doctor = create(:doctor, clinic: clinic)
        16.times { |i| appointment_at(now + 10.days + i.hours, doctor: other_doctor) }

        expect(ids(fetch(user: clerk)).size).to eq(20)
      end
    end

    it "行が増えても、SQL の本数は変わらない（N+1 を出さない）" do
      3.times { |i| appointment_at(now + (i + 1).days, doctor: create(:doctor, clinic: clinic)) }
      fetch(user: clerk) # 1回目だけ出る準備の SQL を、数える前に済ませる
      few = count_queries { fetch(user: clerk) }

      12.times { |i| appointment_at(now + (i + 10).days, doctor: create(:doctor, clinic: clinic)) }
      many = count_queries { expect(ids(fetch(user: clerk)).size).to eq(15) }

      expect(many).to eq(few)
      # 予約（枠と結合）・枠・患者・医師・医療機関の5本
      expect(many).to eq(5)
    end
  end

  describe "異常系" do
    describe "医療機関ごとの分離" do
      include_context "自院とほかの医療機関に予約がある"

      it "事務スタッフに、ほかの医療機関の予約は出ない" do
        expect(ids(fetch(user: clerk))).to eq([ mine.id ])
      end

      it "医師には、自分が担当の予約だけが出る（同じ医療機関のほかの医師の予約は出ない）" do
        appointment_at(now + 1.day, doctor: create(:doctor, clinic: clinic))

        expect(ids(fetch(user: doctor))).to eq([ mine.id ])
      end

      it "患者には、自分の予約だけが出る" do
        expect(ids(fetch(user: mine.patient))).to eq([ mine.id ])
        expect(ids(fetch(user: create(:patient)))).to eq([])
      end

      it "絞り込みに、ほかの医療機関の医師の id を入れても、何も出ない" do
        expect(ids(fetch(user: clerk, filter: { doctorId: other_clinic.slot.doctor_id.to_s }))).to eq([])
      end
    end

    describe "絞り込み" do
      include_context "3日に分かれた予約がある"

      it "日付の範囲は、日本時間で、from と to の日を含む" do
        expect(ids(fetch(user: clerk, filter: { from: "2030-01-08", to: "2030-01-08" }))).to eq([ day2_canceled.id ])
        expect(ids(fetch(user: clerk, filter: { from: "2030-01-08" }))).to eq([ day2_canceled.id, day3.id ])
        expect(ids(fetch(user: clerk, filter: { to: "2030-01-08" }))).to eq([ day1.id, day2_canceled.id ])
      end
    end

    describe "続きの読み込み（カーソル）" do
      include_context "続けて読む予約が5件ある"

      it "読んでいる途中で、前のほうに予約が増えても、同じ行が2回出ない・抜けない" do
        first_page = fetch(user: clerk, first: 2)
        appointment_at(now + 1.hour) # すでに読んだ範囲より前に、1件増える

        second_page = fetch(user: clerk, first: 10, after: first_page.dig("pageInfo", "endCursor"))

        expect(ids(first_page) + ids(second_page)).to eq(appointments.map(&:id))
      end

      it "最後のページでは hasNextPage が false。ちょうど件数ぶん読んだときも false" do
        expect(fetch(user: clerk, first: 5).dig("pageInfo", "hasNextPage")).to be(false)
        expect(fetch(user: clerk, first: 4).dig("pageInfo", "hasNextPage")).to be(true)
      end

      it "1回に読めるのは50件まで。51件あって first: 51 と頼んでも、50件で、続きがあると返る" do
        other_doctor = create(:doctor, clinic: clinic)
        46.times { |i| appointment_at(now + 10.days + i.hours, doctor: other_doctor) }
        expect(Appointment.count).to eq(51)

        result = execute_graphql("{ appointments(first: 51) { edges { node { id } } pageInfo { hasNextPage } } }", user: clerk, now: now)

        expect(result.dig("data", "appointments", "edges").size).to eq(50)
        expect(result.dig("data", "appointments", "pageInfo", "hasNextPage")).to be(true)
      end

      it "壊れたカーソルは、DB に渡す前に、BAD_REQUEST で断る" do
        broken = [
          "こわれた",                                  # Base64 ですらない
          cursor("2030-01-07T00:00:00Z"),             # 数が足りない
          cursor("きのう", 1),                         # 時刻として読めない
          cursor("2030-01-07T00:00:00Z", "1 OR 1=1"), # id が数でない
          cursor([ "2030-01-07T00:00:00Z" ], 1),      # 入れ子
          cursor(true, 1)
        ]
        allow(AppLog).to receive(:error)

        broken.each do |after|
          result = execute_graphql(query, variables: { after: after }, user: clerk, now: now, expect_errors: true)

          expect(result["errors"].map { |error| error.dig("extensions", "code") }).to eq([ "BAD_REQUEST" ]), "after: #{after}"
        end
        expect(AppLog).not_to have_received(:error)
      end
    end

    it "ログインしていなければ、UNAUTHENTICATED で断る" do
      result = execute_graphql(query, user: nil, now: now, expect_errors: true)

      expect(result["errors"].map { |error| error.dig("extensions", "code") }).to eq([ "UNAUTHENTICATED" ])
      expect(result["data"]).to be_nil
    end
  end
end
