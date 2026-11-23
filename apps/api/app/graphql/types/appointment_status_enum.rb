# typed: false

module Types
  class AppointmentStatusEnum < Types::BaseEnum
    graphql_name "AppointmentStatus"

    value "BOOKED", "予約済", value: "booked"
    value "CHECKED_IN", "受付済", value: "checked_in"
    value "IN_CONSULTATION", "診察中", value: "in_consultation"
    value "COMPLETED", "診察済", value: "completed"
    value "CANCELED", "キャンセル", value: "canceled"
    value "NO_SHOW", "無断キャンセル", value: "no_show"
  end
end
