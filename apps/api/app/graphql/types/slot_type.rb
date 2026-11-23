# typed: false

module Types
  class SlotType < Types::BaseObject
    graphql_name "Slot"
    description "診療枠"

    field :id, ID, null: false
    field :starts_at, GraphQL::Types::ISO8601DateTime, null: false
    field :ends_at, GraphQL::Types::ISO8601DateTime, null: false
    field :closed_at, GraphQL::Types::ISO8601DateTime
    field :can_close, Boolean, null: false, description: "今、ログインしている人が閉じられるか（予約が入っているかは、閉じるときに確かめる）"
    field :doctor, Types::DoctorType, null: false
    field :clinic, Types::ClinicType, null: false

    def can_close = object.closed_at.nil? && SlotPolicy.new(context[:current_user]).close?(object)

    def doctor = record(::StaffMember, object.doctor_id)

    def clinic = record(::Clinic, object.clinic_id)
  end
end
