# 診療枠を閉じる。閉じられるのは、有効な予約が入っていない枠だけ
module Slots
  class Close
    def initialize(actor:, slot_id:, now:)
      @actor = actor
      @slot_id = slot_id
      @now = now
    end

    def call
      return Result.error("NOT_PERMITTED", "診療枠を閉じられるのは、医師と事務スタッフだけです") unless @actor.is_a?(StaffMember)

      Slot.transaction do
        # 枠の行を、排他のロックで読む。予約する処理（FOR SHARE）は、ここが終わるまで待つ。
        # 「予約がないと確かめたあとに、予約が入る」を防ぐ
        slot = Slot.lock.find_by(id: @slot_id, clinic_id: @actor.clinic_id)
        next Result.error("NOT_FOUND", "診療枠が見つかりません", field: "slotId") unless slot
        next Result.error("NOT_PERMITTED", "ほかの医師の診療枠は閉じられません") unless SlotPolicy.new(@actor).close?(slot)
        next Result.error("INVALID_STATE", "この枠は、すでに閉じられています") if slot.closed_at
        next Result.error("INVALID_STATE", "予約が入っている枠は、閉じられません") if slot.appointments.where.not(status: "canceled").exists?

        slot.update!(closed_at: @now)
        Result.success(slot)
      end
    end
  end
end
