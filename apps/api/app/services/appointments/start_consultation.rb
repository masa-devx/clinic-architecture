# typed: false

# 診察を始める。担当の医師が、受付済の予約に対してだけできる
module Appointments
  class StartConsultation
    def initialize(actor:, appointment_id:, now:)
      @actor = actor
      @appointment_id = appointment_id
      @now = now
    end

    def call
      # 医師に見えるのは、自分が担当の予約だけ（AppointmentPolicy.scope）
      appointment = AppointmentPolicy.scope(@actor).find_by(id: @appointment_id)
      return Result.error("NOT_FOUND", "予約が見つかりません", field: "appointmentId") unless appointment
      return Result.error("NOT_PERMITTED", "診察を始められるのは、担当の医師だけです") unless AppointmentPolicy.new(@actor, appointment).consult?

      Appointment.transaction do
        moved = Transition.move(appointment.id, from: "checked_in", to: "in_consultation", at: :started_at, now: @now)
        next Result.error("INVALID_STATE", "診察を始められるのは、受付済の予約だけです") unless moved

        Audit.appointment(actor: @actor, action: "appointment.start", appointment: appointment, now: @now)
        Result.success(appointment.reload)
      end
    end
  end
end
