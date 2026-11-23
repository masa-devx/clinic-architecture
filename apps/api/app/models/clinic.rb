# typed: false

# 医療機関。データを分ける単位（テナント）
class Clinic < ApplicationRecord
  has_many :staff_members, dependent: :restrict_with_exception
  has_many :slots, dependent: :restrict_with_exception

  validates :name, presence: true
end
