# typed: false

module Types
  class PatientType < Types::BaseObject
    graphql_name "Patient"
    description "患者"

    field :id, ID, null: false
    field :name, String, null: false

    # 患者が見られる患者は、自分だけ。スタッフは、見られる予約（AppointmentType）をたどった先としてだけ届く
    def self.authorized?(patient, context)
      user = context[:current_user]
      super && (user.is_a?(::StaffMember) || user == patient)
    end
  end
end
