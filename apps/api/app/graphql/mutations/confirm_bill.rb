# typed: false

module Mutations
  class ConfirmBill < BaseMutation
    description "会計を確定する。確定したあとは、明細を変えられない"

    argument :bill_id, ID, required: true

    field :bill, Types::BillType

    def resolve(bill_id:)
      result = Bills::Confirm.new(actor: current_user, bill_id: bill_id, now: now).call
      { bill: result.value, errors: result.errors }
    end
  end
end
