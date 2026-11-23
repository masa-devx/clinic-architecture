# typed: false

module Types
  class ClinicType < Types::BaseObject
    graphql_name "Clinic"
    description "医療機関"

    field :id, ID, null: false
    field :name, String, null: false
    field :doctors, [ Types::DoctorType ], null: false

    def doctors = dataloader.with(Sources::DoctorsByClinic).load(object.id)
  end
end
