# 診療枠の認可。要件の4章の表を、ここだけに書く
class SlotPolicy
  def initialize(user)
    @user = user
  end

  # 医師は自分の枠、事務スタッフは自院の全員の枠を作れる
  def create_for?(doctor)
    return false unless @user.is_a?(StaffMember) && doctor.doctor?
    return false unless doctor.clinic_id == @user.clinic_id

    @user.clerk? || doctor.id == @user.id
  end

  # 患者は、どの医療機関の枠も予約できる。事務スタッフは、自院の枠に、患者の代わりに予約を入れられる
  def book?(slot)
    return true if @user.is_a?(Patient)

    @user.is_a?(StaffMember) && @user.clerk? && slot.clinic_id == @user.clinic_id
  end

  # 閉じられるのは、枠を作れる人と同じ（医師は自分の枠、事務スタッフは自院の全員の枠）
  def close?(slot)
    @user.is_a?(StaffMember) && slot.clinic_id == @user.clinic_id && (@user.clerk? || slot.doctor_id == @user.id)
  end
end
