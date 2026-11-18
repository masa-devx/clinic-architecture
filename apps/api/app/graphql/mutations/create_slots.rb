module Mutations
  class CreateSlots < BaseMutation
    description "診療枠をまとめて作る。すでにある枠・時間が重なる枠は飛ばす"

    argument :input, Types::CreateSlotsInput, required: true

    field :created_count, Integer, description: "作った枠の数"
    field :skipped_count, Integer, description: "すでにあったので飛ばした枠の数"

    def resolve(input:)
      result = Slots::BulkCreate.new(actor: current_user, now: now, **input.to_h).call
      { created_count: result.value&.created_count, skipped_count: result.value&.skipped_count, errors: result.errors }
    end
  end
end
