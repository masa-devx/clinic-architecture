# typed: false

module Resolvers
  class OwnClinicAvailableSlots < BaseResolver
    description "自院の、空いている診療枠。開始時刻の順（スタッフ用。医療機関は、ログインしている人の所属で決まる）"

    type Types::SlotType.connection_type, null: false

    argument :doctor_id, ID, required: false
    argument :from, GraphQL::Types::ISO8601Date, required: false, description: "この日から（日本時間）"
    argument :to, GraphQL::Types::ISO8601Date, required: false, description: "この日まで（日本時間。この日を含む）"

    def resolve(doctor_id: nil, from: nil, to: nil)
      query = Slots::AvailableQuery.new(clinic_id: current_user.clinic_id, doctor_id: doctor_id, from: from, to: to, now: now)
      Pagination::KeysetConnection.new(query.relation, keys: query.keys)
    end
  end
end
