# typed: false

require "rails_helper"

RSpec.describe Appointments::CancellationRule do
  let(:starts_at) { Time.zone.local(2030, 1, 7, 9) }

  def violation(**overrides)
    described_class.violation(**{ by_patient: true, status: "booked", starts_at: starts_at, now: starts_at - 2.hours }.merge(overrides))&.code
  end

  describe "正常系" do
    it "予約済で、期限の前なら、キャンセルできる" do
      expect(violation).to be_nil
    end
  end

  describe "異常系" do
    it "患者は、開始の1時間前ちょうどまで" do
      expect(violation(now: starts_at - 1.hour)).to be_nil
      expect(violation(now: starts_at - 1.hour + 1.second)).to eq("CANCEL_DEADLINE_PASSED")
    end

    it "事務スタッフは、開始の1秒前まで。開始の時刻ちょうどからは、できない" do
      expect(violation(by_patient: false, now: starts_at - 1.second)).to be_nil
      expect(violation(by_patient: false, now: starts_at)).to eq("CANCEL_DEADLINE_PASSED")
      expect(violation(by_patient: false, now: starts_at + 1.hour)).to eq("CANCEL_DEADLINE_PASSED")
    end

    it "受付済の予約は、事務スタッフだけがキャンセルできる（開始の時刻を過ぎていても）" do
      expect(violation(status: "checked_in", by_patient: false, now: starts_at + 10.minutes)).to be_nil
      expect(violation(status: "checked_in", by_patient: true)).to eq("INVALID_STATE")
    end

    %w[in_consultation completed canceled no_show].each do |status|
      it "状態が #{status} なら、誰でもキャンセルできない" do
        expect(violation(status: status)).to eq("INVALID_STATE")
        expect(violation(status: status, by_patient: false)).to eq("INVALID_STATE")
      end
    end
  end
end
