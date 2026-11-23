# typed: false

# 送る通知の記録（outbox）。予約の登録・キャンセルと同じトランザクションで入れて、あとからジョブが送る。
# 「予約は入ったのに、メールが出ない」を起こさないため
class CreateOutboxMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :outbox_messages do |t|
      t.string :kind, null: false
      t.references :appointment, null: false, foreign_key: true, index: false
      # 同じ通知を2回入れないための鍵（例: reminder:123）
      t.string :dedup_key, null: false
      t.string :status, null: false, default: "pending"
      t.integer :attempts, null: false, default: 0
      # 送る係が取ったら、この時刻までは、ほかの係が取らない。送る前に落ちても、この時刻を過ぎれば、もう一度取られる
      t.datetime :locked_until
      t.datetime :sent_at
      # 最後に失敗したときの、エラーの種類の名前だけ（中身は残さない。宛先などが入りうるため）
      t.string :last_error
      t.timestamps

      t.index :dedup_key, unique: true
      # 送る係は、まだ送っていない行だけを、古い順に探す
      t.index [ :id ], where: "status = 'pending'", name: "index_outbox_messages_pending"
      t.index :appointment_id
      t.check_constraint "kind IN ('booking_confirmed', 'booking_canceled', 'reminder')", name: "outbox_messages_kind_check"
      t.check_constraint "status IN ('pending', 'sent', 'skipped', 'failed')", name: "outbox_messages_status_check"
    end
  end
end
