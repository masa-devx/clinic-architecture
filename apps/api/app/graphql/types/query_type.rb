module Types
  class QueryType < Types::BaseObject
    field :me, resolver: Resolvers::Me
    field :clinics, resolver: Resolvers::Clinics
    field :clinic, resolver: Resolvers::ClinicById
    field :available_slots, resolver: Resolvers::AvailableSlots
    field :appointments, resolver: Resolvers::Appointments
    field :appointment, resolver: Resolvers::AppointmentById
    field :bill, resolver: Resolvers::BillById
    field :fee_items, resolver: Resolvers::FeeItems
    field :audit_logs, resolver: Resolvers::AuditLogs
    field :dashboard, resolver: Resolvers::Dashboard
  end
end
