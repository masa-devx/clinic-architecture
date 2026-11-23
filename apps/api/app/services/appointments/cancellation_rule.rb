# typed: false

# 予約をキャンセルできるかの決まり。DB も時計も読まない（now は外から渡す）
module Appointments
  module CancellationRule
    # 患者がキャンセルできるのは、開始のこの時間前まで。仮の値（要件 13章の M6）
    PATIENT_DEADLINE = 1.hour

    module_function

    # キャンセルできるなら nil、できないなら UserError を返す
    def violation(by_patient:, status:, starts_at:, now:)
      # 受付済の予約をキャンセルできるのは、事務スタッフだけ（患者はもう来ているので、医療機関の側の都合のとき）
      return nil if status == "checked_in" && !by_patient

      unless status == "booked"
        return UserError.new(code: "INVALID_STATE", message: "この予約は、もうキャンセルできません")
      end

      if by_patient && now > starts_at - PATIENT_DEADLINE
        hours = PATIENT_DEADLINE.in_hours.to_i
        return UserError.new(code: "CANCEL_DEADLINE_PASSED", message: "キャンセルできるのは、開始の#{hours}時間前までです。医療機関に連絡してください")
      end

      # 事務スタッフは、開始の時刻まで。始まったあとの予約は、キャンセルではなく、診察か無断キャンセルになる
      if now >= starts_at
        return UserError.new(code: "CANCEL_DEADLINE_PASSED", message: "開始の時刻を過ぎた予約は、キャンセルできません")
      end

      nil
    end
  end
end
