# typed: false

module Resolvers
  class Appointments < BaseResolver
    description "予約の一覧。患者は自分の予約、医師は自分が担当の予約、事務スタッフは自院の全部。枠の開始時刻の順"

    type Types::AppointmentType.connection_type, null: false

    argument :filter, Types::AppointmentFilterInput, required: false
    argument :descending, Boolean, required: false, default_value: false, description: "新しい順にする（過去の予約を見るとき）"

    def resolve(descending:, filter: nil)
      query = ::Appointments::ListQuery.new(actor: current_user, **filter.to_h)
      Pagination::KeysetConnection.new(query.relation, keys: query.keys, descending: descending)
    end
  end
end
