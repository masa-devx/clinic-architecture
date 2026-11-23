# typed: false

# 明日の予約のリマインドを、outbox に入れる。定期に動かす（config/recurring.yml）
class EnqueueRemindersJob < ApplicationJob
  def perform = Notifications::EnqueueReminders.new(now: Time.current).call
end
