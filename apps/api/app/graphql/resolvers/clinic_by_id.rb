module Resolvers
  class ClinicById < BaseResolver
    description "医療機関の1件。医療機関と医師の名前は、ログインしていれば誰でも見られる"

    type Types::ClinicType, null: true

    argument :id, ID, required: true

    def resolve(id:) = ::Clinic.find_by(id: id)
  end
end
