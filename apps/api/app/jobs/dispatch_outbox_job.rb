# outbox の通知を送る。定期に動かす（config/recurring.yml）
class DispatchOutboxJob < ApplicationJob
  def perform = Notifications::Dispatch.new(now: Time.current).call
end
