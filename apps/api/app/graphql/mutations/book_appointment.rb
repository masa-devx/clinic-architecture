module Mutations
  class BookAppointment < BaseMutation
    description "空いている診療枠を予約する。事務スタッフは、患者のメールアドレスを指定して、代わりに入れる"

    argument :slot_id, ID, required: true
    argument :patient_email, String, required: false, description: "事務スタッフが代わりに入れるときの、患者のメールアドレス"

    field :appointment, Types::AppointmentType

    def resolve(slot_id:, patient_email: nil)
      result = Appointments::Book.new(actor: current_user, slot_id: slot_id, patient_email: patient_email, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
