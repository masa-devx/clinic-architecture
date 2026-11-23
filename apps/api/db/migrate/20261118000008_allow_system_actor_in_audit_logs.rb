# typed: false

# 監査ログの「した人」に、システム（定期の処理）を足す。無断キャンセルにする処理も、患者の予約を変えるので、残す
class AllowSystemActorInAuditLogs < ActiveRecord::Migration[8.1]
  def change
    remove_check_constraint :audit_logs, "actor_type IN ('Patient', 'StaffMember')", name: "audit_logs_actor_type_check"
    change_column_null :audit_logs, :actor_id, true
    # システムのときだけ、した人の id がない
    add_check_constraint :audit_logs,
      "(actor_type IN ('Patient', 'StaffMember') AND actor_id IS NOT NULL) OR (actor_type = 'System' AND actor_id IS NULL)",
      name: "audit_logs_actor_check"
  end
end
