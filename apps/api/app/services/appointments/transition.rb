# 予約の状態を、決めた遷移で1つ進める。
# 「今も from の状態なら」を更新の条件に入れるので、2回押されても・ほかの操作と同時でも、進むのは1回だけ
module Appointments
  module Transition
    module_function

    # 進められたら true。状態がすでに変わっていたら false
    # still は、ほかにも「今もそうなら」を足したいときの条件（例: 時間を確かめた枠のままなら）
    def move(appointment_id, from:, to:, at:, now:, still: {})
      Appointment.where(id: appointment_id, status: from, **still).update_all(status: to, at => now, updated_at: now) == 1
    end
  end
end
