# typed: false

require "rails_helper"

# 予約の一覧の SQL の形（R-1）。結果の正しさは test/graphql/appointments_query_spec.rb で確かめる。
# ここでは、大きな医療機関でも速く読める形になっていることを確かめる（速さそのものは docs/improvements/R-1-appointment-list.md）
RSpec.describe Appointments::ListQuery do
  let(:clinic) { create(:clinic) }
  let(:clerk) { create(:clerk, clinic: clinic) }
  let(:doctor) { create(:doctor, clinic: clinic) }
  let(:patient) { create(:patient) }
  let!(:mine) { create(:appointment, patient: patient, slot: create(:slot, doctor: doctor, starts_at: 2.days.from_now)) }
  let!(:other_clinic) { create(:appointment) }

  def sql_of(actor) = described_class.new(actor: actor).relation.to_sql

  describe "正常系" do
    it "スタッフの一覧は、枠の医療機関でも絞る（枠の索引を、時刻の順にたどれるようにするため）" do
      expect(sql_of(clerk)).to include(%("slots"."clinic_id" = #{clinic.id}))
    end

    it "枠の医療機関で絞っても、返る予約は変わらない（予約と枠の医療機関は、組の外部キーで同じ）" do
      expect(described_class.new(actor: clerk).relation.to_a).to eq([ mine ])
    end

    it "患者の一覧は、自分の予約だけで絞る（枠の医療機関では絞らない。いくつもの医療機関にまたがるため）" do
      expect(sql_of(patient)).not_to include(%("slots"."clinic_id"))
      expect(described_class.new(actor: patient).relation.to_a).to eq([ mine ])
    end
  end
end
