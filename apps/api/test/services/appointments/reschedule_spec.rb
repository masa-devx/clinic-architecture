require "rails_helper"

RSpec.describe Appointments::Reschedule do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:doctor) { create(:doctor) }
  let(:old_slot) { create(:slot, doctor: doctor, starts_at: now + 1.day) }
  let(:new_slot) { create(:slot, doctor: doctor, starts_at: now + 2.days) }
  let(:patient) { create(:patient) }
  let!(:appointment) { create(:appointment, slot: old_slot, patient: patient) }

  def reschedule(actor: patient, to: new_slot, at: now, appointment_id: appointment.id)
    described_class.new(actor: actor, appointment_id: appointment_id, slot_id: to.id, now: at).call
  end

  describe "正常系" do
    it "空いている枠へ変えると、状態は予約済のまま、枠だけが変わる。前の枠は、ほかの人が予約できる" do
      result = reschedule

      expect(result).to be_success
      expect(appointment.reload).to have_attributes(slot_id: new_slot.id, status: "booked")
      expect(Appointments::Book.new(actor: create(:patient), slot_id: old_slot.id, now: now).call).to be_success
    end

    it "キャンセルされた予約がある枠へは、変えられる" do
      create(:appointment, :canceled, slot: new_slot)

      expect(reschedule).to be_success
    end
  end

  describe "異常系" do
    it "埋まっている枠へは変えられず、予約は前の枠のまま残る" do
      create(:appointment, slot: new_slot)

      expect(reschedule.errors.map(&:code)).to eq([ "SLOT_TAKEN" ])
      expect(appointment.reload.slot_id).to eq(old_slot.id)
    end

    it "時刻を過ぎた枠・閉じた枠へは変えられない" do
      expect(reschedule(to: create(:slot, doctor: doctor, starts_at: now)).errors.map(&:code)).to eq([ "SLOT_UNAVAILABLE" ])
      expect(reschedule(to: create(:slot, doctor: doctor, starts_at: now + 3.days, closed_at: now)).errors.map(&:code)).to eq([ "SLOT_UNAVAILABLE" ])
    end

    it "ほかの医療機関の枠へは変えられない（見つからない）" do
      expect(reschedule(to: create(:slot, starts_at: now + 2.days)).errors.map { |error| [ error.code, error.field ] }).to eq([ [ "NOT_FOUND", "slotId" ] ])
      expect(appointment.reload.slot_id).to eq(old_slot.id)
    end

    it "患者は、今の枠の開始の1時間前を過ぎると変えられない。事務スタッフは変えられる" do
      late = old_slot.starts_at - 30.minutes

      expect(reschedule(at: late).errors.map(&:code)).to eq([ "CANCEL_DEADLINE_PASSED" ])
      expect(reschedule(actor: create(:clerk, clinic: doctor.clinic), at: late)).to be_success
    end

    it "キャンセルした予約は変えられない" do
      Appointments::Cancel.new(actor: patient, appointment_id: appointment.id, now: now).call

      expect(reschedule.errors.map(&:code)).to eq([ "INVALID_STATE" ])
    end

    it "ほかの患者の予約は NOT_FOUND。担当の医師は NOT_PERMITTED" do
      expect(reschedule(actor: create(:patient)).errors.map(&:code)).to eq([ "NOT_FOUND" ])
      expect(reschedule(actor: doctor).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
      expect(appointment.reload.slot_id).to eq(old_slot.id)
    end

    # 本当に別々の接続でコミットしないと確かめられないので、トランザクションで包まない
    describe "同時に来たとき" do
      self.use_transactional_tests = false

      after do
        [ AuditLog, OutboxMessage, Appointment, Slot, Patient, StaffMember, Clinic ].each(&:delete_all)
      end

      def run_together(jobs)
        ready = Queue.new
        start = Queue.new
        threads = jobs.map do |job|
          Thread.new do
            ActiveRecord::Base.connection_pool.with_connection do
              ready << true
              start.pop
              job.call
            end
          end
        end
        jobs.size.times { ready.pop }
        jobs.size.times { start << true }
        threads.map(&:value)
      end

      it "10人が同じ空き枠へ同時に変えようとすると、1人だけ成功し、残りは前の枠のまま" do
        appointments = Array.new(10) { |i| create(:appointment, slot: create(:slot, doctor: doctor, starts_at: now + 3.days + i.hours)) }

        results = run_together(appointments.map do |each|
          -> { described_class.new(actor: each.patient, appointment_id: each.id, slot_id: new_slot.id, now: now).call }
        end)

        expect(results.count(&:success?)).to eq(1)
        expect(results.reject(&:success?).flat_map { |result| result.errors.map(&:code) }.uniq).to eq([ "SLOT_TAKEN" ])
        expect(Appointment.where(slot_id: new_slot.id).count).to eq(1)
        expect(Appointment.where(status: "booked").count).to eq(11)
      end

      it "2人が互いの枠へ同時に変えようとしても、枠に2件は入らず、例外も外へ出ない（何度やっても）" do
        other = create(:appointment, slot: new_slot)

        20.times do
          first_slot, second_slot = appointment.reload.slot_id, other.reload.slot_id
          results = run_together([
            -> { described_class.new(actor: appointment.patient, appointment_id: appointment.id, slot_id: second_slot, now: now).call },
            -> { described_class.new(actor: other.patient, appointment_id: other.id, slot_id: first_slot, now: now).call }
          ])

          # 互いの枠は埋まっているので、どちらも入れ替われない。デッドロックで止められた側は CONFLICT になる
          expect(results.flat_map { |result| result.errors.map(&:code) } - [ "SLOT_TAKEN", "CONFLICT" ]).to eq([])
          expect(results.count(&:success?)).to eq(0)
          expect([ appointment.reload.slot_id, other.reload.slot_id ]).to eq([ first_slot, second_slot ])
        end
      end
    end
  end
end
