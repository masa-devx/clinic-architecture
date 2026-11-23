# typed: false

module Types
  class DashboardRowType < Types::BaseObject
    graphql_name "DashboardRow"
    description "ダッシュボードの1行（ある日の、ある医師の集計）"

    field :date, GraphQL::Types::ISO8601Date, null: false, description: "日本時間の日付"
    field :doctor, Types::DoctorType, null: false
    field :total, Integer, null: false, description: "予約の件数（キャンセルなども含む、すべて）"
    field :canceled, Integer, null: false
    field :no_show, Integer, null: false
    field :completed, Integer, null: false
    field :revenue, Integer, null: false, description: "売上（円）。支払い済の会計の合計"

    def doctor = record(::StaffMember, object.doctor_id)
  end
end
