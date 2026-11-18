# 送る通知を、outbox に入れる。予約の登録・キャンセルと同じトランザクションの中から呼ぶ
module Notifications
  module Outbox
    module_function

    # 同じ鍵の通知がすでにあれば、入れない（何度呼んでも1件）
    def enqueue(kind:, appointment_id:, dedup_key:, now:)
      OutboxMessage.insert_all(
        [ { kind: kind, appointment_id: appointment_id, dedup_key: dedup_key, created_at: now, updated_at: now } ],
        unique_by: :dedup_key
      )
    end
  end
end
