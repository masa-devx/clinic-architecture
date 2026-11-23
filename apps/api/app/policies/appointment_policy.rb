# typed: false

# 予約の認可（誰が、どの予約を見られるか・キャンセルできるか）。要件の4章の表を、ここだけに書く
class AppointmentPolicy
  # 見られる予約だけに絞った relation。一覧も1件の取得も、必ずここから始める
  # 見られない予約は「見つからない」になり、あるかどうかも分からない
  def self.scope(user)
    case user
    when Patient
      Appointment.where(patient_id: user.id)
    when StaffMember
      scope = Appointment.where(clinic_id: user.clinic_id)
      user.doctor? ? scope.joins(:slot).where(slots: { doctor_id: user.id }) : scope
    else
      Appointment.none
    end
  end

  # slot は、呼ぶ側がすでに読んでいれば渡す（一覧で1件ずつ読み直さないため）
  def initialize(user, appointment, slot: nil)
    @user = user
    @appointment = appointment
    @slot = slot
  end

  def show?
    case @user
    when Patient
      @appointment.patient_id == @user.id
    when StaffMember
      return false unless @appointment.clinic_id == @user.clinic_id

      @user.clerk? || slot.doctor_id == @user.id
    else
      false
    end
  end

  # 医師は、担当の予約を見られるが、キャンセルはできない
  def cancel?
    show? && (@user.is_a?(Patient) || @user.clerk?)
  end

  # 診察を始める・終えるのは、担当の医師だけ
  def consult?
    @user.is_a?(StaffMember) && @user.doctor? && show?
  end

  # 時刻の変更は、キャンセルできる人と同じ
  def reschedule? = cancel?

  private

  def slot = @slot || @appointment.slot
end
