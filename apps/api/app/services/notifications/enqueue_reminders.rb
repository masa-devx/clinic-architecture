# typed: true

# 明日の予約のリマインドを、outbox に入れる（定期の処理から呼ぶ）。何度呼んでも、同じ予約の同じ日には1件だけ。
# 鍵に日付を入れているので、時刻を変えて別の日になった予約には、新しい日の前日に、もう一度出る
module Notifications
  class EnqueueReminders
    extend T::Sig

    sig { params(appointment_id: Integer, date: Date).returns(String) }
    def self.dedup_key(appointment_id, date) = "reminder:#{appointment_id}:#{date.iso8601}"

    sig { params(now: ActiveSupport::TimeWithZone).void }
    def initialize(now:)
      @now = now
    end

    # 新しく入れた件数を返す
    sig { returns(Integer) }
    def call
      tomorrow = @now.in_time_zone.to_date + 1
      rows = Appointment.booked.joins(:slot).where(slots: { starts_at: tomorrow.all_day }).pluck(:id).map do |id|
        { kind: "reminder", appointment_id: id, dedup_key: self.class.dedup_key(id, tomorrow), created_at: @now, updated_at: @now }
      end
      return 0 if rows.empty?

      OutboxMessage.insert_all(rows, unique_by: :dedup_key, returning: [ :id ]).length
    end
  end
end
