module Mutations
  class RescheduleAppointment < BaseMutation
    description "予約の時刻を変える（同じ医療機関の、空いている枠へ付け替える）"

    argument :appointment_id, ID, required: true
    argument :slot_id, ID, required: true

    field :appointment, Types::AppointmentType

    def resolve(appointment_id:, slot_id:)
      result = Appointments::Reschedule.new(actor: current_user, appointment_id: appointment_id, slot_id: slot_id, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
