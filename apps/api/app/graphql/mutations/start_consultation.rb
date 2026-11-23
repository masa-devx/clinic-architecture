# typed: false

module Mutations
  class StartConsultation < BaseMutation
    description "診察を始める"

    argument :appointment_id, ID, required: true

    field :appointment, Types::AppointmentType

    def resolve(appointment_id:)
      result = Appointments::StartConsultation.new(actor: current_user, appointment_id: appointment_id, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
