module ClerkApi
  class QueryType < Types::BaseObject
    graphql_name "Query"

    field :me, resolver: Resolvers::Me
    field :available_slots, resolver: Resolvers::OwnClinicAvailableSlots
    field :appointments, resolver: Resolvers::Appointments
    field :appointment, resolver: Resolvers::AppointmentById
    field :bill, resolver: Resolvers::BillById
    field :fee_items, resolver: Resolvers::FeeItems
    field :dashboard, resolver: Resolvers::Dashboard
    field :audit_logs, resolver: Resolvers::AuditLogs
  end
end
