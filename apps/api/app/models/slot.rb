# 診療枠。医師 × 開始時刻 × 終了時刻。定員は1人
class Slot < ApplicationRecord
  belongs_to :clinic
  belongs_to :doctor, class_name: "StaffMember", inverse_of: :slots
  has_many :appointments, dependent: :restrict_with_exception
end
