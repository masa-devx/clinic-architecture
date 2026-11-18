# 医師と事務スタッフ。1つの医療機関に属する
class StaffMember < ApplicationRecord
  has_secure_password

  belongs_to :clinic
  has_many :slots, foreign_key: :doctor_id, inverse_of: :doctor, dependent: :restrict_with_exception

  # 値は DB の CHECK（staff_members_role_check）と同じにする
  enum :role, { doctor: "doctor", clerk: "clerk" }, validate: true

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
end
