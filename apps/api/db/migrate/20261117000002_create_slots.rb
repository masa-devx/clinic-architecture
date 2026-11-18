# 診療枠（医師 × 開始時刻 × 終了時刻。定員は1人）
class CreateSlots < ActiveRecord::Migration[8.1]
  def change
    # 「同じ医師の枠の時間は重ならない」（要件 R2）を、等号（医師）と範囲の重なりを組み合わせた排他制約で守るために要る
    enable_extension "btree_gist"

    create_table :slots do |t|
      t.bigint :clinic_id, null: false
      t.bigint :doctor_id, null: false
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.timestamps

      # 医師が、その医療機関の人であることを DB で守る（組で参照する）
      t.foreign_key :staff_members, column: [ :doctor_id, :clinic_id ], primary_key: [ :id, :clinic_id ]
      t.check_constraint "ends_at > starts_at", name: "slots_time_order_check"
      # 同じ医師の枠は、時間が重ならない。[開始, 終了) なので、前の枠の終了と次の枠の開始が同じ時刻でもよい
      t.exclusion_constraint "doctor_id WITH =, tstzrange(starts_at, ends_at) WITH &&",
        using: :gist, name: "slots_no_overlap_per_doctor"

      # 同じ医師の同じ開始時刻は1つ（要件 7-1）。医師ごとに開始時刻の順で読むのにも使う
      t.index [ :doctor_id, :starts_at ], unique: true
      # 医療機関ごとに、開始時刻の順で読む（空いている枠・予約の一覧）。id は並びの決め手
      t.index [ :clinic_id, :starts_at, :id ]
      # appointments から (slot_id, clinic_id) の組で参照するための UNIQUE
      t.index [ :id, :clinic_id ], unique: true
    end
  end
end
