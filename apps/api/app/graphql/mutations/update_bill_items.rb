module Mutations
  class UpdateBillItems < BaseMutation
    description "会計の下書きの明細を、入れ直す"

    argument :bill_id, ID, required: true
    argument :items, [ Types::BillItemInput ], required: true

    field :bill, Types::BillType

    def resolve(bill_id:, items:)
      result = Bills::UpdateItems.new(actor: current_user, bill_id: bill_id, items: items.map(&:to_h), now: now).call
      { bill: result.value, errors: result.errors }
    end
  end
end
