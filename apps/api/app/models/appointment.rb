# 予約。患者が診療枠を1つ押さえたもの
class Appointment < ApplicationRecord
  belongs_to :clinic
  belongs_to :slot
  belongs_to :patient
  belongs_to :booked_by_staff_member, class_name: "StaffMember", optional: true
  has_one :bill, dependent: :restrict_with_exception

  # 値は DB の CHECK（appointments_status_check）と同じにする。遷移の決まりは要件の6章
  enum :status, {
    booked: "booked",
    checked_in: "checked_in",
    in_consultation: "in_consultation",
    completed: "completed",
    canceled: "canceled",
    no_show: "no_show"
  }, validate: true
end
