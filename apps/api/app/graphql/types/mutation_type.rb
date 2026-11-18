module Types
  class MutationType < Types::BaseObject
    field :patient_login, mutation: Mutations::PatientLogin
    field :staff_login, mutation: Mutations::StaffLogin
    field :logout, mutation: Mutations::Logout
    field :create_slots, mutation: Mutations::CreateSlots
    field :book_appointment, mutation: Mutations::BookAppointment
    field :cancel_appointment, mutation: Mutations::CancelAppointment
    field :reschedule_appointment, mutation: Mutations::RescheduleAppointment
    field :close_slot, mutation: Mutations::CloseSlot
    field :check_in, mutation: Mutations::CheckIn
    field :start_consultation, mutation: Mutations::StartConsultation
    field :finish_consultation, mutation: Mutations::FinishConsultation
    field :update_bill_items, mutation: Mutations::UpdateBillItems
    field :confirm_bill, mutation: Mutations::ConfirmBill
    field :mark_bill_paid, mutation: Mutations::MarkBillPaid
    field :refund_bill, mutation: Mutations::RefundBill
    field :save_questionnaire, mutation: Mutations::SaveQuestionnaire
  end
end
