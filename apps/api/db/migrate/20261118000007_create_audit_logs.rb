# 監査ログ。誰が・いつ・どの患者の・何を見たか、変えたか。足すだけで、変えない・消さない
class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :clinic, null: false, foreign_key: true, index: false
      # した人。患者とスタッフは別の表なので、種類と id の組で持つ
      t.string :actor_type, null: false
      t.bigint :actor_id, null: false
      t.string :action, null: false
      # どの患者のデータか
      t.references :patient, null: false, foreign_key: true, index: false
      # 何を（予約・会計・問診）
      t.string :subject_type, null: false
      t.bigint :subject_id, null: false
      t.datetime :occurred_at, null: false

      t.check_constraint "actor_type IN ('Patient', 'StaffMember')", name: "audit_logs_actor_type_check"
      # 書き込みが多い表なので、インデックスは、読み方（医療機関ごとに、新しい順）に合わせた1本だけにする。
      # インデックスが多いほど、1行足すたびの書き込みが増える
      t.index [ :clinic_id, :occurred_at, :id ]
    end

    # 監査ログを見られるのは、事務スタッフのうち、管理者だけ
    add_column :staff_members, :admin, :boolean, null: false, default: false
  end
end
