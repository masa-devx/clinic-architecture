module DoctorApi
  class QueryType < Types::BaseObject
    graphql_name "Query"

    field :me, resolver: Resolvers::Me
    field :available_slots, resolver: Resolvers::OwnClinicAvailableSlots
    field :appointments, resolver: Resolvers::Appointments
    field :appointment, resolver: Resolvers::AppointmentById
  end
end
