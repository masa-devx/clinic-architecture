# typed: false

# 患者。医療機関に属さず、複数の医療機関を予約できる
class Patient < ApplicationRecord
  has_secure_password

  has_many :appointments, dependent: :restrict_with_exception

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
end
