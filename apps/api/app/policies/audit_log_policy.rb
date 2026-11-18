# 監査ログの認可。見られるのは、自院の分を、管理者の事務スタッフだけ（要件の4章）
class AuditLogPolicy
  def self.viewer?(user) = user.is_a?(StaffMember) && user.clerk? && user.admin?

  def self.scope(user)
    return AuditLog.none unless viewer?(user)

    AuditLog.where(clinic_id: user.clinic_id)
  end
end
