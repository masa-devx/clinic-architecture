module Mutations
  class MarkBillPaid < BaseMutation
    description "会計を、支払い済にする（窓口で受け取ったことを記録する）"

    argument :bill_id, ID, required: true

    field :bill, Types::BillType

    def resolve(bill_id:)
      result = Bills::Settle.new(actor: current_user, bill_id: bill_id, step: :pay, now: now).call
      { bill: result.value, errors: result.errors }
    end
  end
end
