module Mutations
  class BookAppointment < BaseMutation
    description "空いている診療枠を予約する"

    argument :slot_id, ID, required: true

    field :appointment, Types::AppointmentType

    def resolve(slot_id:)
      result = Appointments::Book.new(actor: current_user, slot_id: slot_id, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
