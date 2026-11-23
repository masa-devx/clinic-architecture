# typed: true

# 監査ログを足す、共通の入口。業務の処理（変えた）と、問診・会計を読む所（見た）から呼ぶ。
# 変える処理の中では、同じトランザクションの中で呼ぶ（変えたのに記録がない、を起こさない）
module Audit
  extend T::Sig

  # subject は、予約・会計・問診のレコード
  sig { params(actor: T.any(Patient, StaffMember), action: String, clinic_id: Integer, patient_id: Integer, subject: T.any(Appointment, Bill, QuestionnaireResponse), now: ActiveSupport::TimeWithZone).returns(AuditLog) }
  def self.record(actor:, action:, clinic_id:, patient_id:, subject:, now:)
    AuditLog.create!(
      clinic_id: clinic_id, actor_type: actor.class.name, actor_id: actor.id, action: action,
      patient_id: patient_id, subject_type: subject.class.name, subject_id: subject.id, occurred_at: now
    )
  end

  sig { params(actor: T.any(Patient, StaffMember), action: String, appointment: Appointment, now: ActiveSupport::TimeWithZone).returns(AuditLog) }
  def self.appointment(actor:, action:, appointment:, now:)
    record(actor: actor, action: action, clinic_id: appointment.clinic_id, patient_id: appointment.patient_id, subject: appointment, now: now)
  end

  sig { params(actor: T.any(Patient, StaffMember), action: String, bill: Bill, now: ActiveSupport::TimeWithZone).returns(AuditLog) }
  def self.bill(actor:, action:, bill:, now:)
    # 会計は、必ず予約に付く（belongs_to・NOT NULL）。関連の型は nil を含むので、T.must で「ない」を例外にする
    appointment = T.must(bill.appointment)
    record(actor: actor, action: action, clinic_id: bill.clinic_id, patient_id: appointment.patient_id, subject: bill, now: now)
  end
end
