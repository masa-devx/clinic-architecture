# typed: false

# 空いている診療枠（これからの枠で、有効な予約が入っていないもの）
module Slots
  class AvailableQuery
    def initialize(clinic_id:, now:, doctor_id: nil, from: nil, to: nil)
      @clinic_id = clinic_id
      @now = now
      @doctor_id = doctor_id
      @from = from
      @to = to
    end

    def relation
      relation = Slot.where(clinic_id: @clinic_id, closed_at: nil).where("slots.starts_at > ?", @now)
      relation = relation.where(doctor_id: @doctor_id) if @doctor_id
      relation = relation.where("slots.starts_at >= ?", Time.zone.local(@from.year, @from.month, @from.day)) if @from
      relation = relation.where("slots.starts_at < ?", Time.zone.local(@to.year, @to.month, @to.day) + 1.day) if @to
      # 予約と結合して数えるのではなく、「有効な予約が1件もない」を NOT EXISTS で書く（キャンセルした予約は数えない）
      relation.where(<<~SQL.squish)
        NOT EXISTS (
          SELECT 1 FROM appointments
          WHERE appointments.slot_id = slots.id AND appointments.status <> 'canceled'
        )
      SQL
    end

    # Pagination::KeysetConnection に渡す並びのキー（開始時刻 → id）
    def keys
      [
        { sql: "slots.starts_at", cast: "timestamptz", value: ->(slot) { slot.starts_at.utc.iso8601(6) } },
        { sql: "slots.id", cast: "bigint", value: ->(slot) { slot.id } }
      ]
    end
  end
end
