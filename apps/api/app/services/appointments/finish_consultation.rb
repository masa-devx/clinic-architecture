# typed: false

# 診察を終える。会計の下書きを、同じトランザクションで作る
module Appointments
  class FinishConsultation
    def initialize(actor:, appointment_id:, now:)
      @actor = actor
      @appointment_id = appointment_id
      @now = now
    end

    def call
      appointment = AppointmentPolicy.scope(@actor).find_by(id: @appointment_id)
      return Result.error("NOT_FOUND", "予約が見つかりません", field: "appointmentId") unless appointment
      return Result.error("NOT_PERMITTED", "診察を終えられるのは、担当の医師だけです") unless AppointmentPolicy.new(@actor, appointment).consult?

      Appointment.transaction do
        # 2回押されても、状態を進められるのは1回だけ。進められなかった側は、会計を作らずに戻る
        moved = Transition.move(appointment.id, from: "in_consultation", to: "completed", at: :completed_at, now: @now)
        next Result.error("INVALID_STATE", "診察を終えられるのは、診察中の予約だけです") unless moved

        # 「診察は終わったのに、会計がない」を起こさないように、状態の変更と一緒にコミットする
        Bill.create!(clinic_id: appointment.clinic_id, appointment: appointment, status: :draft)
        Audit.appointment(actor: @actor, action: "appointment.finish", appointment: appointment, now: @now)
        Result.success(appointment.reload)
      end
    end
  end
end
