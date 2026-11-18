module Mutations
  class CloseSlot < BaseMutation
    description "診療枠を閉じる（予約が入っていない枠だけ）"

    argument :slot_id, ID, required: true

    field :slot, Types::SlotType

    def resolve(slot_id:)
      result = Slots::Close.new(actor: current_user, slot_id: slot_id, now: now).call
      { slot: result.value, errors: result.errors }
    end
  end
end
