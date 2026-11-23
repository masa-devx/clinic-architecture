# typed: false

# ログインのセッション。Cookie には合言葉（トークン）だけを入れ、誰のセッションかは、この表が持つ。
# ログアウトで行を消すと、控えておいた Cookie の値も、その場で使えなくなる
class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions do |t|
      # トークンそのものは持たない。DB の中身が漏れても、そのままログインに使えないように、ハッシュだけを持つ
      t.string :token_digest, null: false
      t.references :patient, foreign_key: true
      t.references :staff_member, foreign_key: true
      t.datetime :expires_at, null: false
      t.timestamps

      t.index :token_digest, unique: true
      # 患者かスタッフの、どちらか片方だけ
      t.check_constraint "num_nonnulls(patient_id, staff_member_id) = 1", name: "sessions_one_user_check"
    end
  end
end
