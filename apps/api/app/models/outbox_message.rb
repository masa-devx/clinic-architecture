# 送る通知の記録（outbox）
class OutboxMessage < ApplicationRecord
  belongs_to :appointment

  # 値は DB の CHECK と同じにする
  enum :kind, { booking_confirmed: "booking_confirmed", booking_canceled: "booking_canceled", reminder: "reminder" }, validate: true
  enum :status, { pending: "pending", sent: "sent", skipped: "skipped", failed: "failed" }, validate: true
end
