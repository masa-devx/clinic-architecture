module Mutations
  class CheckIn < BaseMutation
    description "受付（チェックイン）をする"

    argument :appointment_id, ID, required: true

    field :appointment, Types::AppointmentType

    def resolve(appointment_id:)
      result = Appointments::CheckIn.new(actor: current_user, appointment_id: appointment_id, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
