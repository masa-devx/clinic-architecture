# typed: false

# 予約する。同じ枠に同時に来ても、成功するのは1件だけ
# 患者は自分の予約を入れる。事務スタッフは、自院の枠に、患者（メールアドレスで指定）の代わりに入れる
module Appointments
  class Book
    def initialize(actor:, slot_id:, now:, patient_email: nil)
      @actor = actor
      @slot_id = slot_id
      @now = now
      @patient_email = patient_email
    end

    def call
      Appointment.transaction do
        # 枠の行を、共有のロックで読む。同時に予約する人どうしは待たないが、枠を閉じる処理（FOR UPDATE）とは待ち合う。
        # 「閉じていないと確かめたあとに、閉じられる」を防ぐ
        slot = Slot.lock("FOR SHARE").find_by(id: @slot_id)
        next Result.error("NOT_FOUND", "診療枠が見つかりません", field: "slotId") unless slot && visible?(slot)
        next Result.error("NOT_PERMITTED", "この診療枠に予約を入れる権限がありません") unless SlotPolicy.new(@actor).book?(slot)
        next Result.error("SLOT_UNAVAILABLE", "この枠は、予約できません（時刻を過ぎたか、閉じられました）", field: "slotId") if slot.starts_at <= @now || slot.closed_at

        patient = find_patient
        next Result.error("NOT_FOUND", "このメールアドレスの患者が見つかりません", field: "patientEmail") unless patient

        # 「空いているか確かめてから入れる」は、確かめたあとに他の人が入れると破れる。
        # 確かめずに入れて、DB の UNIQUE（index_appointments_on_slot_id_active）に1件だけ通してもらう
        appointment = Appointment.create!(
          clinic_id: slot.clinic_id, slot: slot, patient: patient, status: :booked,
          booked_by_staff_member: (@actor if @actor.is_a?(StaffMember))
        )
        # 送るメールの記録を、予約と同じトランザクションで入れる（予約だけ入って、メールが出ない、を起こさない）。
        # メールを送るのは、あとでジョブがする（トランザクションの中で、外のサービスを呼ばない）
        Notifications::Outbox.enqueue(kind: "booking_confirmed", appointment_id: appointment.id, dedup_key: "booked:#{appointment.id}", now: @now)
        Audit.appointment(actor: @actor, action: "appointment.book", appointment: appointment, now: @now)
        Result.success(appointment)
      end
    rescue ActiveRecord::RecordNotUnique
      Result.error("SLOT_TAKEN", "すでに埋まっています。ほかの枠を選んでください", field: "slotId")
    end

    private

    # スタッフには、ほかの医療機関の枠は「見つからない」
    def visible?(slot) = !@actor.is_a?(StaffMember) || slot.clinic_id == @actor.clinic_id

    def find_patient
      return @actor if @actor.is_a?(Patient)

      Patient.find_by(email: @patient_email) if @patient_email.present?
    end
  end
end
