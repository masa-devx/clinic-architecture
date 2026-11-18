module Mutations
  class CancelAppointment < BaseMutation
    description "予約をキャンセルする"

    argument :appointment_id, ID, required: true

    field :appointment, Types::AppointmentType

    def resolve(appointment_id:)
      result = Appointments::Cancel.new(actor: current_user, appointment_id: appointment_id, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
