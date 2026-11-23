# typed: false

# 受付（チェックイン）。患者が、予約の時刻の前に「準備できた」と伝える
module Appointments
  class CheckIn
    def initialize(actor:, appointment_id:, now:)
      @actor = actor
      @appointment_id = appointment_id
      @now = now
    end

    def call
      appointment = AppointmentPolicy.scope(@actor).includes(:slot).find_by(id: @appointment_id)
      return Result.error("NOT_FOUND", "予約が見つかりません", field: "appointmentId") unless appointment
      return Result.error("NOT_PERMITTED", "受付できるのは、予約した患者だけです") unless @actor.is_a?(Patient)

      violation = ConsultationRule.check_in_violation(status: appointment.status, starts_at: appointment.slot.starts_at, now: @now)
      return Result.failure(violation) if violation

      Appointment.transaction do
        # 無断キャンセルの定期の処理と同時に来ても、どちらか片方だけが通る。
        # 時間を確かめたあとに、時刻の変更で別の枠になっていたら、進めない（still）
        moved = Transition.move(
          appointment.id, from: "booked", to: "checked_in", at: :checked_in_at, now: @now, still: { slot_id: appointment.slot_id }
        )
        next Result.error("INVALID_STATE", "この予約は、受付できません") unless moved

        Audit.appointment(actor: @actor, action: "appointment.check_in", appointment: appointment, now: @now)
        Result.success(appointment.reload)
      end
    end
  end
end
