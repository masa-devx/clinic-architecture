# typed: false

# 問診の認可。要件の4章の表を、ここだけに書く。
# 患者は自分の分、医師は自分が担当の分。事務スタッフには見せない（役割ごとに見える物が違う例）
class QuestionnairePolicy
  def initialize(user, appointment, slot: nil)
    @user = user
    @appointment = appointment
    @slot = slot
  end

  def show?
    case @user
    when Patient then @appointment.patient_id == @user.id
    when StaffMember then @user.doctor? && @appointment.clinic_id == @user.clinic_id && slot.doctor_id == @user.id
    else false
    end
  end

  # 答えられるのは、予約した患者だけ。診察が始まる前（予約済・受付済）まで
  def answer?
    @user.is_a?(Patient) && show? && (@appointment.booked? || @appointment.checked_in?)
  end

  private

  def slot = @slot || @appointment.slot
end
