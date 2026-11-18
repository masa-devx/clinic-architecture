# ダッシュボードの集計。日ごと・医師ごとの、予約の件数・キャンセル・無断キャンセル・診察済・売上。
# 開くたびに、その場で集計する（集計の表は、まだ作っていない。遅くなったら、測ってから足す）
module Dashboards
  class DailyQuery
    MAX_DAYS = 31

    Row = Data.define(:date, :doctor_id, :total, :canceled, :no_show, :completed, :revenue)

    def initialize(clinic_id:, from:, to:)
      @clinic_id = clinic_id
      @from = from
      @to = to
    end

    def rows
      # 日の区切りは、日本時間。DB の中の時刻は UTC なので、日本時間に直してから日付にする
      day = "(slots.starts_at AT TIME ZONE '#{Time.zone.tzinfo.name}')::date"
      Appointment.where(clinic_id: @clinic_id)
        .joins(:slot)
        # 会計は、予約に1つまで（UNIQUE）。結合しても、予約の行は増えないので、件数は狂わない
        .left_joins(:bill)
        .where(slots: { starts_at: Time.zone.local(@from.year, @from.month, @from.day)...(Time.zone.local(@to.year, @to.month, @to.day) + 1.day) })
        .group(Arel.sql(day), "slots.doctor_id")
        .order(Arel.sql(day), "slots.doctor_id")
        .pluck(
          Arel.sql(day), Arel.sql("slots.doctor_id"), Arel.sql("COUNT(*)"),
          Arel.sql("COUNT(*) FILTER (WHERE appointments.status = 'canceled')"),
          Arel.sql("COUNT(*) FILTER (WHERE appointments.status = 'no_show')"),
          Arel.sql("COUNT(*) FILTER (WHERE appointments.status = 'completed')"),
          # 売上は、支払い済の会計の合計（返金済は入れない）
          Arel.sql("COALESCE(SUM(bills.total_amount) FILTER (WHERE bills.status = 'paid'), 0)")
        ).map { |values| Row.new(*values) }
    end
  end
end
