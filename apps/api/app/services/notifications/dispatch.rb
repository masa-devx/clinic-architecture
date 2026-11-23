# typed: false

# outbox の、まだ送っていない通知を送る（定期の処理から呼ぶ）
#
# 1. 短いトランザクションで、送る行を「取る」（locked_until を先の時刻にする。ほかの係とは SKIP LOCKED でぶつからない）
# 2. トランザクションの外で、メールを送る（送っているあいだ、DB のロックも接続も持ち続けない）
# 3. 送れたら「送信済」にする
#
# 2 と 3 のあいだで落ちると、locked_until を過ぎたあとに、もう一度送られる。
# 「1回も送られない」より「まれに2回送られる」を選んでいる（少なくとも1回）
module Notifications
  class Dispatch
    BATCH_SIZE = 50
    LOCK_FOR = 5.minutes
    MAX_ATTEMPTS = 5

    def initialize(now:, batch_size: BATCH_SIZE)
      @now = now
      @batch_size = batch_size
    end

    # 送った件数を返す
    def call
      claim.count { |message| deliver(message) }
    end

    private

    def claim
      OutboxMessage.transaction do
        messages = OutboxMessage.pending
          .where("locked_until IS NULL OR locked_until < ?", @now)
          .order(:id).limit(@batch_size).lock("FOR UPDATE SKIP LOCKED")
          # メールに要るもの（患者・医療機関・枠・医師）を、まとめて読んでおく
          .preload(appointment: [ :patient, :clinic, { slot: :doctor } ]).to_a
        OutboxMessage.where(id: messages.map(&:id)).update_all(locked_until: @now + LOCK_FOR, updated_at: @now)
        messages
      end
    end

    def deliver(message)
      appointment = message.appointment
      # リマインドは、送る時点でキャンセルされていたら・時刻が変わって別の日になっていたら、送らない
      if message.reminder? && stale_reminder?(message, appointment)
        finish(message, status: "skipped")
        return false
      end

      AppointmentMailer.with(appointment: appointment).public_send(message.kind).deliver_now
      finish(message, status: "sent", sent_at: @now, attempts: message.attempts + 1)
      true
    rescue StandardError => e
      # 送れなかった通知は、取ったまま残す（locked_until を過ぎたら、もう一度試される）。決めた回数を超えたら、あきらめる
      attempts = message.attempts + 1
      message.update_columns(attempts: attempts, last_error: e.class.name, status: attempts >= MAX_ATTEMPTS ? "failed" : "pending", updated_at: @now)
      # SMTP のエラーの文には、宛先のメールアドレスが入ることがある。ログには、種類と場所だけを出す
      AppLog.error("notifications.dispatch", err: e, omit_message: true, outboxMessageId: message.id, attempts: attempts)
      false
    end

    def stale_reminder?(message, appointment)
      date = appointment.slot.starts_at.in_time_zone.to_date
      !appointment.booked? || message.dedup_key != EnqueueReminders.dedup_key(appointment.id, date)
    end

    # 手元の message は「取る」前に読んだ値なので、変わった列だけを見て書く update! ではなく、指定した列を必ず書く
    def finish(message, **columns)
      message.update_columns(locked_until: nil, updated_at: @now, **columns)
    end
  end
end
