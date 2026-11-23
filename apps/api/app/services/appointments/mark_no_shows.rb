# typed: true

# 開始から一定の時間たっても受付がない予約を、無断キャンセルにする（定期の処理から呼ぶ）
module Appointments
  class MarkNoShows
    extend T::Sig

    BATCH_SIZE = 500

    sig { params(now: ActiveSupport::TimeWithZone, batch_size: Integer).void }
    def initialize(now:, batch_size: BATCH_SIZE)
      @now = now
      @batch_size = batch_size
    end

    # 無断キャンセルにした件数を返す
    sig { returns(Integer) }
    def call
      cutoff = ConsultationRule.no_show_cutoff(@now)
      total = 0
      loop do
        # 少しずつ更新する。1つの大きな UPDATE で、たくさんの行のロックを長く持たない
        ids = Appointment.booked.joins(:slot).where("slots.starts_at < ?", cutoff).limit(@batch_size).pluck(:id)
        break if ids.empty?

        total += mark(ids)
      end
      total
    end

    private

    def mark(ids)
      Appointment.transaction do
        # 選んだあとに受付された予約は、「今も予約済なら」の条件で外れる。
        # 行をロックして読むのは、誰の予約を変えたかを、監査ログに正しく残すため（読んだ行と、更新する行を同じにする）
        rows = Appointment.where(id: ids, status: "booked").lock.pluck(:id, :clinic_id, :patient_id)
        next 0 if rows.empty?

        Appointment.where(id: rows.map(&:first)).update_all(status: "no_show", no_show_at: @now, updated_at: @now)
        AuditLog.insert_all!(rows.map do |id, clinic_id, patient_id|
          {
            clinic_id: clinic_id, actor_type: "System", actor_id: nil, action: "appointment.no_show",
            patient_id: patient_id, subject_type: "Appointment", subject_id: id, occurred_at: @now
          }
        end)
        rows.size
      end
    end
  end
end
