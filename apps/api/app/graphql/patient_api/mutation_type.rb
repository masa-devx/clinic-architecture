module PatientApi
  class MutationType < Types::BaseObject
    graphql_name "Mutation"

    field :login, mutation: Mutations::Login
    field :logout, mutation: Mutations::Logout
    field :book_appointment, mutation: Mutations::BookAppointment
    field :cancel_appointment, mutation: Mutations::CancelAppointment
    field :reschedule_appointment, mutation: Mutations::RescheduleAppointment
    field :check_in, mutation: Mutations::CheckIn
    field :save_questionnaire, mutation: Mutations::SaveQuestionnaire
  end
end
