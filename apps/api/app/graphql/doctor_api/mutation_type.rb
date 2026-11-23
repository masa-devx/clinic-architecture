# typed: false

module DoctorApi
  class MutationType < Types::BaseObject
    graphql_name "Mutation"

    field :login, mutation: Mutations::Login
    field :logout, mutation: Mutations::Logout
    field :create_slots, mutation: Mutations::CreateSlots
    field :close_slot, mutation: Mutations::CloseSlot
    field :start_consultation, mutation: Mutations::StartConsultation
    field :finish_consultation, mutation: Mutations::FinishConsultation
  end
end
