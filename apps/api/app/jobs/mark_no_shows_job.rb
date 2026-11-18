# 受付のないまま時間を過ぎた予約を、無断キャンセルにする。定期に動かす（config/recurring.yml）
class MarkNoShowsJob < ApplicationJob
  def perform = Appointments::MarkNoShows.new(now: Time.current).call
end
