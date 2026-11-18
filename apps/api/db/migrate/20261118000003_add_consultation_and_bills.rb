# 受付〜診察の日時と、会計（料金の表・会計・明細）
class AddConsultationAndBills < ActiveRecord::Migration[8.1]
  def change
    # 状態ごとの日時を残す（要件の6章）
    change_table :appointments do |t|
      t.datetime :checked_in_at
      t.datetime :started_at
      t.datetime :completed_at
      t.datetime :no_show_at
    end

    # 料金の表（医療機関ごと）。値段を変えても、過去の会計は変わらない（明細に、その時の値段を写すため）
    create_table :fee_items do |t|
      t.references :clinic, null: false, foreign_key: true
      t.string :name, null: false
      # 金額は、円の整数（要件 R6）
      t.integer :unit_price, null: false
      t.timestamps
      t.check_constraint "unit_price >= 0", name: "fee_items_unit_price_check"
      t.index [ :id, :clinic_id ], unique: true
    end

    create_table :bills do |t|
      t.bigint :clinic_id, null: false
      # 1つの予約（診察）に、会計は1つ
      t.references :appointment, null: false, foreign_key: true, index: { unique: true }
      t.string :status, null: false, default: "draft"
      # 合計は、確定のときに決める。確定の前は NULL
      t.integer :total_amount
      t.datetime :billed_at
      t.datetime :paid_at
      t.datetime :refunded_at
      t.timestamps

      t.foreign_key :clinics
      t.index [ :clinic_id, :status ]
      t.check_constraint "status IN ('draft', 'billed', 'paid', 'refunded')", name: "bills_status_check"
      # 下書きのあいだは合計がなく、確定したら合計がある
      t.check_constraint "(status = 'draft') = (total_amount IS NULL)", name: "bills_total_amount_check"
      t.check_constraint "total_amount >= 0", name: "bills_total_amount_range_check"
    end

    create_table :bill_items do |t|
      t.references :bill, null: false, foreign_key: true
      # その時の名前と値段を、料金の表から写して持つ（要件 R4）
      t.string :name, null: false
      t.integer :unit_price, null: false
      t.integer :quantity, null: false
      t.timestamps
      t.check_constraint "unit_price >= 0", name: "bill_items_unit_price_check"
      t.check_constraint "quantity BETWEEN 1 AND 99", name: "bill_items_quantity_check"
    end
  end
end
