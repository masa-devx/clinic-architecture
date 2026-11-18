module PatientApi
  class QueryType < Types::BaseObject
    graphql_name "Query"

    field :me, resolver: Resolvers::Me
    field :clinics, resolver: Resolvers::Clinics
    field :clinic, resolver: Resolvers::ClinicById
    field :available_slots, resolver: Resolvers::AvailableSlots
    field :appointments, resolver: Resolvers::Appointments
    field :appointment, resolver: Resolvers::AppointmentById
    field :bill, resolver: Resolvers::BillById
  end
end
