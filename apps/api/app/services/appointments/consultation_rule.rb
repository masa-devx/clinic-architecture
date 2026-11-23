# typed: true

# 受付できる時間の決まり。DB も時計も読まない（now は外から渡す）
module Appointments
  module ConsultationRule
    extend T::Sig

    # 受付できるのは、開始のこの時間前から。仮の値（要件 13章の M6）
    CHECK_IN_OPENS_BEFORE = 30.minutes
    # 開始からこの時間たっても受付がない予約は、無断キャンセルにする。受付できるのも、ここまで。仮の値（同上）
    NO_SHOW_AFTER = 15.minutes

    # 受付できるなら nil、できないなら UserError を返す
    sig { params(status: String, starts_at: ActiveSupport::TimeWithZone, now: ActiveSupport::TimeWithZone).returns(T.nilable(UserError)) }
    def self.check_in_violation(status:, starts_at:, now:)
      return UserError.new(code: "INVALID_STATE", message: "この予約は、受付できません") unless status == "booked"

      if now < starts_at - CHECK_IN_OPENS_BEFORE
        minutes = CHECK_IN_OPENS_BEFORE.in_minutes.to_i
        return UserError.new(code: "OUTSIDE_TIME_WINDOW", message: "受付できるのは、開始の#{minutes}分前からです")
      end
      if now > starts_at + NO_SHOW_AFTER
        return UserError.new(code: "OUTSIDE_TIME_WINDOW", message: "受付できる時間を過ぎました。医療機関に連絡してください")
      end

      nil
    end

    # この時刻より前に始まる「予約済」は、無断キャンセルにする
    sig { params(now: ActiveSupport::TimeWithZone).returns(ActiveSupport::TimeWithZone) }
    def self.no_show_cutoff(now) = now - NO_SHOW_AFTER
  end
end
