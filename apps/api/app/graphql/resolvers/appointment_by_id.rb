module Resolvers
  class AppointmentById < BaseResolver
    description "予約の1件。見られない予約は null"

    type Types::AppointmentType, null: true

    argument :id, ID, required: true

    def resolve(id:) = AppointmentPolicy.scope(current_user).find_by(id: id)
  end
end
