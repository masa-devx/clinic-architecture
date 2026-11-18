module ClerkApi
  class MutationType < Types::BaseObject
    graphql_name "Mutation"

    field :login, mutation: Mutations::Login
    field :logout, mutation: Mutations::Logout
    field :create_slots, mutation: Mutations::CreateSlots
    field :close_slot, mutation: Mutations::CloseSlot
    field :book_appointment, mutation: Mutations::BookAppointmentForPatient
    field :cancel_appointment, mutation: Mutations::CancelAppointment
    field :reschedule_appointment, mutation: Mutations::RescheduleAppointment
    field :update_bill_items, mutation: Mutations::UpdateBillItems
    field :confirm_bill, mutation: Mutations::ConfirmBill
    field :mark_bill_paid, mutation: Mutations::MarkBillPaid
    field :refund_bill, mutation: Mutations::RefundBill
  end
end
