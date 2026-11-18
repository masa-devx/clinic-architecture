# 監査ログを足す、共通の入口。業務の処理（変えた）と、問診・会計を読む所（見た）から呼ぶ。
# 変える処理の中では、同じトランザクションの中で呼ぶ（変えたのに記録がない、を起こさない）
module Audit
  module_function

  # subject は、予約・会計・問診のレコード
  def record(actor:, action:, clinic_id:, patient_id:, subject:, now:)
    AuditLog.create!(
      clinic_id: clinic_id, actor_type: actor.class.name, actor_id: actor.id, action: action,
      patient_id: patient_id, subject_type: subject.class.name, subject_id: subject.id, occurred_at: now
    )
  end

  def appointment(actor:, action:, appointment:, now:)
    record(actor: actor, action: action, clinic_id: appointment.clinic_id, patient_id: appointment.patient_id, subject: appointment, now: now)
  end

  def bill(actor:, action:, bill:, now:)
    record(actor: actor, action: action, clinic_id: bill.clinic_id, patient_id: bill.appointment.patient_id, subject: bill, now: now)
  end
end
