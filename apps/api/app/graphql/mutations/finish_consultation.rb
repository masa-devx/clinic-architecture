# typed: false

module Mutations
  class FinishConsultation < BaseMutation
    description "診察を終える。会計の下書きができる"

    argument :appointment_id, ID, required: true

    field :appointment, Types::AppointmentType

    def resolve(appointment_id:)
      result = Appointments::FinishConsultation.new(actor: current_user, appointment_id: appointment_id, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
