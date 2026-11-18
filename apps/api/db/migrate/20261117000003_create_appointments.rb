# 予約（患者が診療枠を1つ押さえたもの）
class CreateAppointments < ActiveRecord::Migration[8.1]
  def change
    create_table :appointments do |t|
      t.bigint :clinic_id, null: false
      t.bigint :slot_id, null: false
      t.references :patient, null: false, foreign_key: true
      # 状態は1つの列で持つ（要件 6章）。フラグの列を並べない
      t.string :status, null: false, default: "booked"
      t.datetime :canceled_at
      t.timestamps

      # 予約の医療機関が、枠の医療機関と同じであることを DB で守る（組で参照する）
      t.foreign_key :slots, column: [ :slot_id, :clinic_id ], primary_key: [ :id, :clinic_id ]
      t.check_constraint(
        "status IN ('booked', 'checked_in', 'in_consultation', 'completed', 'canceled', 'no_show')",
        name: "appointments_status_check"
      )
      # 「キャンセル」と「キャンセルした日時」が、片方だけにならない
      t.check_constraint "(status = 'canceled') = (canceled_at IS NOT NULL)", name: "appointments_canceled_at_check"

      # 1つの枠に、有効な予約は1件まで（要件 R1）。キャンセルした予約は数えないので、枠をもう一度予約できる
      t.index :slot_id, unique: true, where: "status <> 'canceled'", name: "index_appointments_on_slot_id_active"
      # キャンセルも含めて、枠から予約を引く（予約の一覧の結合）
      t.index :slot_id
    end
  end
end
