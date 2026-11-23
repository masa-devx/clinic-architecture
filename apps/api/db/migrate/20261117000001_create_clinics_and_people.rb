# typed: false

# 医療機関（テナント）と、ログインする人（患者・スタッフ）
class CreateClinicsAndPeople < ActiveRecord::Migration[8.1]
  def change
    create_table :clinics do |t|
      t.string :name, null: false
      t.timestamps
    end

    # 患者は医療機関に属さない（複数の医療機関を予約できる）
    create_table :patients do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name, null: false
      t.timestamps
      # メールアドレスは、モデルで小文字にそろえてから入れる
      t.index :email, unique: true
    end

    # 医師と事務スタッフ。どちらも1つの医療機関に属する
    create_table :staff_members do |t|
      t.references :clinic, null: false, foreign_key: true
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name, null: false
      t.string :role, null: false
      t.timestamps
      t.index :email, unique: true
      # slots から (doctor_id, clinic_id) の組で参照するための UNIQUE
      t.index [ :id, :clinic_id ], unique: true
      t.check_constraint "role IN ('doctor', 'clerk')", name: "staff_members_role_check"
    end
  end
end
