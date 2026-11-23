# typed: false

# 会計の認可。要件の4章の表を、ここだけに書く
class BillPolicy
  # 見られる会計だけに絞った relation。
  # 事務スタッフは自院の会計。患者は、自分の予約の、確定した会計（下書きは見せない）。医師は見られない
  def self.scope(user)
    case user
    when Patient
      Bill.where.not(status: "draft").where(appointment_id: Appointment.where(patient_id: user.id).select(:id))
    when StaffMember
      user.clerk? ? Bill.where(clinic_id: user.clinic_id) : Bill.none
    else
      Bill.none
    end
  end

  def initialize(user, bill, patient_id: nil)
    @user = user
    @bill = bill
    @patient_id = patient_id
  end

  # patient_id は、呼ぶ側がすでに読んでいれば渡す（一覧で1件ずつ読み直さないため）
  def show?
    case @user
    when Patient then !@bill.draft? && (@patient_id || @bill.appointment.patient_id) == @user.id
    when StaffMember then manage?
    else false
    end
  end

  # 作る・確定する・支払い済にする・返金するのは、自院の事務スタッフだけ
  def manage?
    @user.is_a?(StaffMember) && @user.clerk? && @bill.clinic_id == @user.clinic_id
  end
end
