# typed: false

module Types
  class DoctorType < Types::BaseObject
    graphql_name "Doctor"
    description "医師"

    field :id, ID, null: false
    field :name, String, null: false
  end
end
