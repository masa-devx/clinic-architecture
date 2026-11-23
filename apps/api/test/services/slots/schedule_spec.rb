# typed: false

require "rails_helper"

RSpec.describe Slots::Schedule do
  let(:tokyo) { ActiveSupport::TimeZone["Tokyo"] }

  def generate(**overrides)
    described_class.generate(**{
      from: Date.new(2030, 1, 7), to: Date.new(2030, 1, 7), weekdays: [ 1 ],
      start_minute: 9 * 60, end_minute: 10 * 60, slot_minutes: 30, time_zone: tokyo
    }.merge(overrides))
  end

  describe "正常系" do
    it "時間帯を、1枠の長さで区切る（日本時間）" do
      expect(generate).to eq([
        [ tokyo.local(2030, 1, 7, 9, 0), tokyo.local(2030, 1, 7, 9, 30) ],
        [ tokyo.local(2030, 1, 7, 9, 30), tokyo.local(2030, 1, 7, 10, 0) ]
      ])
    end

    it "選んだ曜日の日だけに作る" do
      # 2030-01-07 は月曜。月曜と水曜を選ぶと、1週間で 7日 と 9日
      days = generate(to: Date.new(2030, 1, 13), weekdays: [ 1, 3 ]).map { |starts_at, _| starts_at.to_date }.uniq

      expect(days).to eq([ Date.new(2030, 1, 7), Date.new(2030, 1, 9) ])
    end
  end

  describe "異常系" do
    it "時間帯の終わりに半端が残るとき、その分の枠は作らない" do
      expect(generate(end_minute: 9 * 60 + 50).size).to eq(1)
    end

    it "時間帯が1枠の長さより短いとき、1つも作らない" do
      expect(generate(end_minute: 9 * 60 + 29)).to eq([])
    end

    it "時間帯が1枠の長さとちょうど同じとき、1つ作る" do
      expect(generate(end_minute: 9 * 60 + 30).size).to eq(1)
    end
  end
end
