require "rails_helper"

RSpec.describe "通知（outbox）" do
  include ActiveSupport::Testing::TimeHelpers

  let(:now) { Time.zone.local(2030, 1, 6, 18) }
  let(:slot) { create(:slot, starts_at: Time.zone.local(2030, 1, 7, 9)) }
  let(:patient) { create(:patient, email: "taro@example.com", name: "山田 太郎") }

  def book = Appointments::Book.new(actor: patient, slot_id: slot.id, now: now).call

  def dispatch(at: now, **options) = Notifications::Dispatch.new(now: at, **options).call

  def mails = ActionMailer::Base.deliveries

  describe "予約・キャンセルと、送るメールの記録" do
    it "予約すると、確認のメールの記録が1件入る。まだ送られない" do
      appointment = book.value

      expect(OutboxMessage.sole).to have_attributes(kind: "booking_confirmed", appointment_id: appointment.id, status: "pending")
      expect(mails).to be_empty
    end

    it "予約が入らなかったとき（すでに埋まっている）は、記録も入らない" do
      create(:appointment, slot: slot)

      expect(book).not_to be_success
      expect(OutboxMessage.count).to eq(0)
    end

    it "記録が入れられなかったら、予約も入らない（同じトランザクション）" do
      allow(Notifications::Outbox).to receive(:enqueue).and_raise(ActiveRecord::StatementInvalid, "わざと失敗させる")

      expect { book }.to raise_error(ActiveRecord::StatementInvalid)
      expect(Appointment.count).to eq(0)
    end

    it "キャンセルすると、キャンセルのメールの記録が入る。キャンセルできなかったときは入らない" do
      appointment = book.value
      Appointments::Cancel.new(actor: patient, appointment_id: appointment.id, now: now).call
      Appointments::Cancel.new(actor: patient, appointment_id: appointment.id, now: now).call

      expect(OutboxMessage.order(:id).pluck(:kind)).to eq(%w[booking_confirmed booking_canceled])
    end
  end

  describe "送る（Notifications::Dispatch）" do
    it "まだ送っていない記録を送り、送信済にする。2回動かしても、同じメールは1通だけ" do
      book

      expect(dispatch).to eq(1)
      expect(dispatch).to eq(0)

      expect(mails.size).to eq(1)
      expect(mails.first).to have_attributes(to: [ "taro@example.com" ], subject: "【#{slot.clinic.name}】ご予約を受け付けました")
      expect(mails.first.body.to_s).to include("山田 太郎 さま", "2030年1月7日 09:00〜09:30", slot.doctor.name)
      expect(OutboxMessage.sole).to have_attributes(status: "sent", sent_at: now, attempts: 1, locked_until: nil)
    end

    it "送るのに失敗した記録は残り、時間をおいて、もう一度試される。5回失敗したら、あきらめる" do
      book
      allow(AppLog).to receive(:error)
      allow(mails).to receive(:<<).and_raise(Net::SMTPServerBusy, "混んでいます")

      expect(dispatch).to eq(0)
      expect(OutboxMessage.sole).to have_attributes(status: "pending", attempts: 1, last_error: "Net::SMTPServerBusy")
      # 取ってから5分のあいだは、ほかの係（次の実行）は取らない
      expect { dispatch(at: now + 5.minutes) }.not_to(change { OutboxMessage.sole.attempts })

      (1..4).each { |i| dispatch(at: now + (i * 6).minutes) }
      expect(OutboxMessage.sole).to have_attributes(status: "failed", attempts: 5)
      expect(dispatch(at: now + 1.hour)).to eq(0)
      expect(AppLog).to have_received(:error).exactly(5).times
    end

    it "送るのに失敗したときのログに、宛先のメールアドレスを出さない（SMTP のエラーの文には、宛先が入ることがある）" do
      book
      allow(mails).to receive(:<<).and_raise(Net::SMTPFatalError, "550 5.1.1 <taro@example.com>: Recipient address rejected")
      output = StringIO.new
      logger = ActiveSupport::Logger.new(output)
      Rails.logger.broadcast_to(logger)
      dispatch
      Rails.logger.stop_broadcasting_to(logger)

      expect(output.string).to include("notifications.dispatch", "Net::SMTPFatalError")
      expect(output.string).not_to include("taro@example.com")
      expect(OutboxMessage.sole.last_error).to eq("Net::SMTPFatalError")
    end

    it "失敗のあと、次に送れたら、送信済になる" do
      book
      allow(AppLog).to receive(:error)
      allow(mails).to receive(:<<).and_raise(Net::SMTPServerBusy, "混んでいます")
      dispatch
      allow(mails).to receive(:<<).and_call_original

      expect(dispatch(at: now + 6.minutes)).to eq(1)
      expect(OutboxMessage.sole).to have_attributes(status: "sent", attempts: 2)
      expect(mails.size).to eq(1)
    end

    it "1回に送る数より多くても、繰り返し動かせば、全部が1通ずつ送られる" do
      3.times { |i| Appointments::Book.new(actor: create(:patient), slot_id: create(:slot, starts_at: slot.starts_at + (i + 1).hours).id, now: now).call }

      expect(dispatch(batch_size: 2)).to eq(2)
      expect(dispatch(batch_size: 2)).to eq(1)
      expect(mails.flat_map(&:to).uniq.size).to eq(3)
    end

    it "メールの宛先と本文を、ログに出さない" do
      book
      output = StringIO.new
      logger = ActiveSupport::Logger.new(output)
      Rails.logger.broadcast_to(logger)
      dispatch
      Rails.logger.stop_broadcasting_to(logger)

      expect(mails.size).to eq(1)
      expect(output.string).not_to include("taro@example.com")
      expect(output.string).not_to include("山田 太郎")
    end
  end

  describe "前日のリマインド（Notifications::EnqueueReminders）" do
    def enqueue(at: now) = Notifications::EnqueueReminders.new(now: at).call

    it "明日（日本時間）の「予約済」にだけ、1件ずつ入れる。何度動かしても増えない" do
      tomorrow_first = create(:appointment, slot: create(:slot, starts_at: Time.zone.local(2030, 1, 7, 0, 0)))
      tomorrow_last = create(:appointment, slot: create(:slot, starts_at: Time.zone.local(2030, 1, 7, 23, 59)))
      create(:appointment, slot: create(:slot, starts_at: Time.zone.local(2030, 1, 6, 23, 59)))
      create(:appointment, slot: create(:slot, starts_at: Time.zone.local(2030, 1, 8, 0, 0)))
      create(:appointment, :canceled, slot: create(:slot, starts_at: Time.zone.local(2030, 1, 7, 10)))

      expect(enqueue).to eq(2)
      expect(enqueue).to eq(0)
      expect(OutboxMessage.reminder.pluck(:appointment_id)).to contain_exactly(tomorrow_first.id, tomorrow_last.id)
    end

    it "入れたあとにキャンセルされた予約には、送らない" do
      appointment = book.value
      dispatch
      mails.clear
      enqueue
      Appointments::Cancel.new(actor: patient, appointment_id: appointment.id, now: now).call

      dispatch
      expect(mails.map(&:subject)).to eq([ "【#{slot.clinic.name}】ご予約をキャンセルしました" ])
      expect(OutboxMessage.reminder.sole.status).to eq("skipped")
    end

    it "時刻を変えて別の日になった予約には、新しい日の前日に、もう一度出る。前の日の分がまだ送られていなければ、送らない" do
      appointment = book.value
      dispatch
      mails.clear
      enqueue # 1/7 の予約のリマインド（まだ送っていない）
      later = create(:slot, doctor: slot.doctor, starts_at: Time.zone.local(2030, 1, 10, 9))
      Appointments::Reschedule.new(actor: patient, appointment_id: appointment.id, slot_id: later.id, now: now).call

      dispatch
      expect(mails).to be_empty
      expect(OutboxMessage.reminder.sole.status).to eq("skipped")

      # 新しい日（1/10）の前日（1/9）の18時
      expect(enqueue(at: now + 2.days)).to eq(0)
      expect(enqueue(at: now + 3.days)).to eq(1)
      dispatch(at: now + 3.days)
      expect(mails.sole.body.to_s).to include("2030年1月10日 09:00〜09:30")
    end

    it "リマインドの本文に、日時と、受付の案内が入る" do
      book
      enqueue
      dispatch

      reminder = mails.find { |mail| mail.subject.include?("明日のご予約") }
      expect(reminder.body.to_s).to include("2030年1月7日 09:00〜09:30", "開始の30分前から")
    end
  end

  it "同じ鍵の記録は、DB に2件入らない" do
    appointment = book.value

    expect { OutboxMessage.insert!({ kind: "booking_confirmed", appointment_id: appointment.id, dedup_key: "booked:#{appointment.id}" }) }
      .to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "定期に動かすジョブは、それぞれの処理を呼ぶ" do
    appointment = book.value

    # ジョブは、今の時刻を自分で決める。テストでは、時計を止めて確かめる
    travel_to(now) do
      expect { DispatchOutboxJob.perform_now }.to change { mails.size }.by(1)
      expect(EnqueueRemindersJob.perform_now).to eq(1)
    end
    travel_to(slot.starts_at + 16.minutes) do
      expect(MarkNoShowsJob.perform_now).to eq(1)
    end
    expect(appointment.reload.status).to eq("no_show")
  end
end
