# typed: false

# 予約の時刻を変える。状態は変えず、枠だけを付け替える（予約済のときだけ）
#
# 「新しい枠を押さえる」と「前の枠を空ける」は、1つの UPDATE（slot_id の付け替え）で同時に起きる。
# 片方だけ成功することはない。新しい枠が埋まっていれば、UNIQUE に当たって、前の枠のまま残る
module Appointments
  class Reschedule
    def initialize(actor:, appointment_id:, slot_id:, now:)
      @actor = actor
      @appointment_id = appointment_id
      @slot_id = slot_id
      @now = now
    end

    def call
      Appointment.transaction do
        appointment = AppointmentPolicy.scope(@actor).includes(:slot).find_by(id: @appointment_id)
        next Result.error("NOT_FOUND", "予約が見つかりません", field: "appointmentId") unless appointment
        next Result.error("NOT_PERMITTED", "この予約を変更する権限がありません") unless AppointmentPolicy.new(@actor, appointment).reschedule?

        # 変更できるかの決まりは、キャンセルと同じ（予約済で、期限の前）
        violation = CancellationRule.violation(
          by_patient: @actor.is_a?(Patient), status: appointment.status, starts_at: appointment.slot.starts_at, now: @now
        )
        next Result.failure(violation) if violation

        # 同じ医療機関の枠の中から探す。枠を閉じる処理と待ち合うように、共有のロックで読む（Book と同じ）
        slot = Slot.lock("FOR SHARE").find_by(id: @slot_id, clinic_id: appointment.clinic_id)
        next Result.error("NOT_FOUND", "診療枠が見つかりません", field: "slotId") unless slot
        next Result.error("SLOT_UNAVAILABLE", "この枠は、予約できません（時刻を過ぎたか、閉じられました）", field: "slotId") if slot.starts_at <= @now || slot.closed_at

        updated = Appointment.where(id: appointment.id, status: "booked").update_all(slot_id: slot.id, updated_at: @now)
        next Result.error("INVALID_STATE", "この予約は、もう変更できません") if updated.zero?

        Audit.appointment(actor: @actor, action: "appointment.reschedule", appointment: appointment, now: @now)
        Result.success(appointment.reload)
      end
    rescue ActiveRecord::RecordNotUnique
      Result.error("SLOT_TAKEN", "すでに埋まっています。ほかの枠を選んでください", field: "slotId")
    rescue ActiveRecord::Deadlocked
      # 2人が、互いの枠へ同時に変えようとすると、相手の結果を待ち合って進めなくなる（デッドロック）。
      # PostgreSQL が片方を止めるので、止められた側には「もう一度」と返す。もう片方は成功している
      Result.error("CONFLICT", "ほかの予約の変更とぶつかりました。空きを確かめて、もう一度試してください")
    end
  end
end
