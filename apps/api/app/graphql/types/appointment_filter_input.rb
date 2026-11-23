# typed: false

module Types
  class AppointmentFilterInput < Types::BaseInputObject
    graphql_name "AppointmentFilter"
    description "予約の一覧の絞り込み。日付は日本時間で、from・to の日を含む"

    argument :from, GraphQL::Types::ISO8601Date, required: false
    argument :to, GraphQL::Types::ISO8601Date, required: false
    argument :doctor_id, ID, required: false
    argument :status, Types::AppointmentStatusEnum, required: false
  end
end
