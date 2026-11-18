module Mutations
  class BookAppointmentForPatient < BaseMutation
    description "事務スタッフが、患者（メールアドレスで指定）の代わりに、自院の空いている診療枠へ予約を入れる"

    argument :slot_id, ID, required: true
    argument :patient_email, String, required: true

    field :appointment, Types::AppointmentType

    def resolve(slot_id:, patient_email:)
      result = Appointments::Book.new(actor: current_user, slot_id: slot_id, patient_email: patient_email, now: now).call
      { appointment: result.value, errors: result.errors }
    end
  end
end
