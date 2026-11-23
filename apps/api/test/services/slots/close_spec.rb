require "rails_helper"

RSpec.describe Slots::Close do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:slot) { create(:slot, starts_at: now + 1.day) }
  let(:clerk) { create(:clerk, clinic: slot.clinic) }

  def close(actor: clerk) = described_class.new(actor: actor, slot_id: slot.id, now: now).call

  it "事務スタッフは自院の枠を、医師は自分の枠を閉じられる。閉じた日時が残る" do
    expect(close).to be_success
    expect(slot.reload.closed_at).to eq(now)

    own = create(:slot, starts_at: now + 2.days)
    expect(described_class.new(actor: own.doctor, slot_id: own.id, now: now).call).to be_success
  end

  it "閉じた枠は、空いている枠に出ず、予約できない" do
    close

    expect(Slots::AvailableQuery.new(clinic_id: slot.clinic_id, now: now).relation).to be_empty
    expect(Appointments::Book.new(actor: create(:patient), slot_id: slot.id, now: now).call.errors.map(&:code)).to eq([ "SLOT_UNAVAILABLE" ])
  end

  it "予約が入っている枠は閉じられない。キャンセルされた予約だけなら閉じられる" do
    appointment = create(:appointment, slot: slot)
    expect(close.errors.map(&:code)).to eq([ "INVALID_STATE" ])
    expect(slot.reload.closed_at).to be_nil

    appointment.update!(status: :canceled, canceled_at: now)
    expect(close).to be_success
  end

  it "すでに閉じた枠は INVALID_STATE" do
    close

    expect(close.errors.map(&:code)).to eq([ "INVALID_STATE" ])
  end

  it "ほかの医療機関の枠は NOT_FOUND。同じ医療機関のほかの医師の枠は NOT_PERMITTED。患者は NOT_PERMITTED" do
    expect(close(actor: create(:clerk)).errors.map(&:code)).to eq([ "NOT_FOUND" ])
    expect(close(actor: create(:doctor, clinic: slot.clinic)).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
    expect(close(actor: create(:patient)).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
    expect(slot.reload.closed_at).to be_nil
  end

  describe "閉じるのと、予約するのが、同時に来たとき" do
    self.use_transactional_tests = false

    after do
      [ AuditLog, OutboxMessage, Appointment, Slot, Patient, StaffMember, Clinic ].each(&:delete_all)
    end

    # other は、閉じるのと同時に、その枠（target）へ予約を入れようとする処理
    def expect_only_one_wins(&other)
      15.times do |i|
        target = create(:slot, doctor: slot.doctor, starts_at: now + 5.days + i.hours)
        other_job = other.call(target, i)
        ready = Queue.new
        start = Queue.new
        jobs = [ -> { described_class.new(actor: clerk, slot_id: target.id, now: now).call }, other_job ]
        threads = jobs.map do |job|
          Thread.new do
            ActiveRecord::Base.connection_pool.with_connection do
              ready << true
              start.pop
              job.call
            end
          end
        end
        2.times { ready.pop }
        2.times { start << true }
        results = threads.map(&:value)

        expect(results.count(&:success?)).to eq(1)
        closed = target.reload.closed_at.present?
        booked = Appointment.where(slot_id: target.id).exists?
        expect([ closed, booked ]).to contain_exactly(true, false)
      end
    end

    it "「閉じた枠に予約が入っている」にはならない（何度やっても、どちらか片方だけが成功する）" do
      expect_only_one_wins do |target, _|
        patient = create(:patient)
        -> { Appointments::Book.new(actor: patient, slot_id: target.id, now: now).call }
      end
    end

    it "時刻の変更で、閉じた枠へ移ることもない" do
      expect_only_one_wins do |target, i|
        appointment = create(:appointment, slot: create(:slot, doctor: slot.doctor, starts_at: now + 20.days + i.hours))
        -> { Appointments::Reschedule.new(actor: appointment.patient, appointment_id: appointment.id, slot_id: target.id, now: now).call }
      end
    end
  end
end
