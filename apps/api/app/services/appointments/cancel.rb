# 予約をキャンセルする。キャンセルした枠は、もう一度予約できるようになる
module Appointments
  class Cancel
    def initialize(actor:, appointment_id:, now:)
      @actor = actor
      @appointment_id = appointment_id
      @now = now
    end

    def call
      # 見られる予約の中から探す。ほかの医療機関・ほかの患者の予約は、あっても「見つからない」
      appointment = AppointmentPolicy.scope(@actor).includes(:slot).find_by(id: @appointment_id)
      return Result.error("NOT_FOUND", "予約が見つかりません", field: "appointmentId") unless appointment

      unless AppointmentPolicy.new(@actor, appointment).cancel?
        return Result.error("NOT_PERMITTED", "この予約をキャンセルする権限がありません")
      end

      violation = CancellationRule.violation(
        by_patient: @actor.is_a?(Patient), status: appointment.status, starts_at: appointment.slot.starts_at, now: @now
      )
      return Result.failure(violation) if violation

      Appointment.transaction do
        # 読んだあとに状態が変わっていても壊れないように、「今も、確かめたときの状態なら」を更新の条件に入れる
        updated = Appointment.where(id: appointment.id, status: appointment.status)
          .update_all(status: "canceled", canceled_at: @now, updated_at: @now)
        next Result.error("INVALID_STATE", "この予約は、もうキャンセルできません") if updated.zero?

        # 送るメールの記録を、状態の変更と同じトランザクションで入れる
        Notifications::Outbox.enqueue(kind: "booking_canceled", appointment_id: appointment.id, dedup_key: "canceled:#{appointment.id}", now: @now)
        Audit.appointment(actor: @actor, action: "appointment.cancel", appointment: appointment, now: @now)
        Result.success(appointment.reload)
      end
    end
  end
end
