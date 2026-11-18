module Mutations
  class RefundBill < BaseMutation
    description "会計を、返金済にする（全額）"

    argument :bill_id, ID, required: true

    field :bill, Types::BillType

    def resolve(bill_id:)
      result = Bills::Settle.new(actor: current_user, bill_id: bill_id, step: :refund, now: now).call
      { bill: result.value, errors: result.errors }
    end
  end
end
