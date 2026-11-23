require "rails_helper"

RSpec.describe Slots::BulkCreate do
  # 2030-01-06 は日曜。翌日の月曜から作る
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:doctor) { create(:doctor) }
  let(:clerk) { create(:clerk, clinic: doctor.clinic) }

  def bulk_create(actor: clerk, **overrides)
    described_class.new(**{
      actor: actor, doctor_id: doctor.id, from: Date.new(2030, 1, 7), to: Date.new(2030, 1, 8), weekdays: [ 1, 2 ],
      start_time: "09:00", end_time: "10:00", slot_minutes: 30, now: now
    }.merge(overrides)).call
  end

  describe "正常系" do
    it "事務スタッフは、自院の医師の枠をまとめて作れる" do
      result = bulk_create

      expect(result.value).to have_attributes(created_count: 4, skipped_count: 0)
      expect(Slot.where(doctor: doctor).order(:starts_at).pluck(:starts_at, :ends_at, :clinic_id).first)
        .to eq([ Time.zone.local(2030, 1, 7, 9), Time.zone.local(2030, 1, 7, 9, 30), doctor.clinic_id ])
    end

    it "医師は、自分の枠を作れる" do
      expect(bulk_create(actor: doctor)).to be_success
    end
  end

  describe "異常系" do
    it "もう一度同じ内容で作ると、すでにある枠は飛ばす" do
      bulk_create

      expect(bulk_create(to: Date.new(2030, 1, 9), weekdays: [ 1, 2, 3 ]).value).to have_attributes(created_count: 2, skipped_count: 4)
      expect(Slot.count).to eq(6)
    end

    it "すでにある枠と時間が重なる枠は飛ばす" do
      bulk_create

      # 9:15 始まりの30分の枠は、どれも 9:00〜10:00 の枠と重なる
      expect(bulk_create(start_time: "09:15", end_time: "09:45").value).to have_attributes(created_count: 0, skipped_count: 2)
    end

    it "今より前の時刻の枠は作らない" do
      result = bulk_create(now: Time.zone.local(2030, 1, 7, 9, 0))

      expect(result.value.created_count).to eq(3)
    end

    it "ほかの医療機関の医師は、いても NOT_FOUND" do
      expect(bulk_create(actor: create(:clerk)).errors.map(&:code)).to eq([ "NOT_FOUND" ])
      expect(Slot.count).to eq(0)
    end

    it "医師は、同じ医療機関のほかの医師の枠を作れない" do
      expect(bulk_create(actor: create(:doctor, clinic: doctor.clinic)).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
    end

    it "事務スタッフの id を医師として指定しても NOT_FOUND" do
      expect(bulk_create(doctor_id: clerk.id).errors.map(&:code)).to eq([ "NOT_FOUND" ])
    end

    it "患者は作れない" do
      expect(bulk_create(actor: create(:patient)).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
    end

    it "入力の誤りは、項目ごとに、まとめて返す" do
      result = bulk_create(to: Date.new(2030, 1, 6), weekdays: [], start_time: "9時", end_time: "10:00", slot_minutes: 0)

      expect(result.errors.map { |error| [ error.code, error.field ] }).to contain_exactly(
        [ "INVALID_INPUT", "to" ], [ "INVALID_INPUT", "weekdays" ], [ "INVALID_INPUT", "slotMinutes" ], [ "INVALID_INPUT", "startTime" ]
      )
    end

    it "終了時刻が開始時刻と同じなら、入力の誤り" do
      expect(bulk_create(end_time: "09:00").errors.map(&:field)).to eq([ "endTime" ])
    end

    it "期間は92日まで。93日は断る" do
      expect(bulk_create(to: Date.new(2030, 1, 7) + 91)).to be_success
      expect(bulk_create(to: Date.new(2030, 1, 7) + 92).errors.map(&:field)).to eq([ "to" ])
    end

    it "過去の日から始まる期間は断る" do
      expect(bulk_create(from: Date.new(2030, 1, 5)).errors.map(&:field)).to eq([ "from" ])
    end

    it "一度に 2,000 枠を超えると断る" do
      result = bulk_create(to: Date.new(2030, 1, 7) + 91, weekdays: [ 0, 1, 2, 3, 4, 5, 6 ], start_time: "00:00", end_time: "23:00", slot_minutes: 5)

      expect(result.errors.map(&:code)).to eq([ "INVALID_INPUT" ])
      expect(Slot.count).to eq(0)
    end
  end
end
