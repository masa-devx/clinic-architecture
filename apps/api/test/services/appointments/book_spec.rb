require "rails_helper"

RSpec.describe Appointments::Book do
  let(:now) { Time.zone.local(2030, 1, 6, 12) }
  let(:slot) { create(:slot, starts_at: now + 1.day) }
  let(:patient) { create(:patient) }
  let(:clerk) { create(:clerk, clinic: slot.clinic) }

  def book(actor: patient, slot_id: slot.id)
    described_class.new(actor: actor, slot_id: slot_id, now: now).call
  end

  def proxy_book(actor: clerk, email: patient.email)
    described_class.new(actor: actor, slot_id: slot.id, patient_email: email, now: now).call
  end

  describe "正常系" do
    it "空いている枠を予約できる。予約の医療機関は、枠の医療機関になる" do
      result = book

      expect(result).to be_success
      expect(result.value).to have_attributes(slot_id: slot.id, patient_id: patient.id, clinic_id: slot.clinic_id, status: "booked")
    end

    it "キャンセルされた枠は、もう一度予約できる" do
      create(:appointment, :canceled, slot: slot)

      expect(book).to be_success
    end

    describe "事務スタッフの代理の予約" do
      it "自院の枠に、患者の代わりに予約を入れられる。誰が入れたかが残る" do
        result = proxy_book

        expect(result.value).to have_attributes(patient_id: patient.id, booked_by_staff_member_id: clerk.id, status: "booked")
      end

      it "患者が自分で入れた予約には、入れたスタッフは残らない" do
        expect(book.value.booked_by_staff_member_id).to be_nil
      end
    end
  end

  describe "異常系" do
    it "すでに予約が入っている枠は、SLOT_TAKEN で断る" do
      create(:appointment, slot: slot)

      result = book

      expect(result.errors.map(&:code)).to eq([ "SLOT_TAKEN" ])
      expect(Appointment.where(slot: slot).count).to eq(1)
    end

    it "開始時刻ちょうどの枠は予約できず、1秒前なら予約できる" do
      expect(described_class.new(actor: patient, slot_id: slot.id, now: slot.starts_at).call.errors.map(&:code)).to eq([ "SLOT_UNAVAILABLE" ])
      expect(described_class.new(actor: patient, slot_id: slot.id, now: slot.starts_at - 1.second).call).to be_success
    end

    it "ない枠は NOT_FOUND" do
      expect(book(slot_id: 0).errors.map(&:code)).to eq([ "NOT_FOUND" ])
    end

    it "医師は予約を入れられない" do
      expect(book(actor: slot.doctor).errors.map(&:code)).to eq([ "NOT_PERMITTED" ])
      expect(Appointment.count).to eq(0)
    end

    it "閉じた枠は予約できない" do
      slot.update!(closed_at: now)

      expect(book.errors.map(&:code)).to eq([ "SLOT_UNAVAILABLE" ])
    end

    describe "事務スタッフの代理の予約" do
      it "メールアドレスは、大文字が混じっていても見つかる。登録のないメールアドレスは NOT_FOUND" do
        expect(proxy_book(email: patient.email.upcase)).to be_success
        expect(proxy_book(email: "nobody@example.com").errors.map { |error| [ error.code, error.field ] }).to eq([ [ "NOT_FOUND", "patientEmail" ] ])
        expect(proxy_book(email: nil).errors.map(&:field)).to eq([ "patientEmail" ])
      end

      it "ほかの医療機関の枠は、あっても NOT_FOUND" do
        expect(proxy_book(actor: create(:clerk)).errors.map { |error| [ error.code, error.field ] }).to eq([ [ "NOT_FOUND", "slotId" ] ])
        expect(Appointment.count).to eq(0)
      end
    end

    # 同時に来たときのことは、本当に別々の接続でコミットしないと確かめられない。
    # そのため、このテストだけはトランザクションで包まず、作ったデータを自分で消す
    describe "同じ枠に、同時に20件の予約が来たとき" do
      self.use_transactional_tests = false

      after do
        AuditLog.delete_all
        OutboxMessage.delete_all
        Appointment.delete_all
        Slot.delete_all
        Patient.delete_all
        StaffMember.delete_all
        Clinic.delete_all
      end

      it "成功するのは1件だけで、残りの19件は SLOT_TAKEN になる" do
        patients = create_list(:patient, 20)
        target = create(:slot, starts_at: now + 1.day)
        ready = Queue.new
        start = Queue.new

        threads = patients.map do |each_patient|
          Thread.new do
            ActiveRecord::Base.connection_pool.with_connection do
              ready << true
              start.pop # 全員の準備ができるまで待って、同時に走り出す
              described_class.new(actor: each_patient, slot_id: target.id, now: now).call
            end
          end
        end
        20.times { ready.pop }
        20.times { start << true }
        results = threads.map(&:value)

        expect(results.count(&:success?)).to eq(1)
        expect(results.reject(&:success?).flat_map { |result| result.errors.map(&:code) }).to eq([ "SLOT_TAKEN" ] * 19)
        expect(Appointment.where(slot_id: target.id).count).to eq(1)
      end
    end
  end
end
