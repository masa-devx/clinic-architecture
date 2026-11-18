# 会計を、支払い済にする（請求済 → 支払い済）・返金する（支払い済 → 返金済。全額）
# 決済サービスにはつながない。窓口で受け取った・返したことを、事務スタッフが記録するだけ
module Bills
  class Settle
    STEPS = {
      pay: { from: "billed", to: "paid", at: :paid_at, action: "bill.pay", message: "支払い済にできるのは、請求済の会計だけです" },
      refund: { from: "paid", to: "refunded", at: :refunded_at, action: "bill.refund", message: "返金できるのは、支払い済の会計だけです" }
    }.freeze

    def initialize(actor:, bill_id:, step:, now:)
      @actor = actor
      @bill_id = bill_id
      @step = STEPS.fetch(step)
      @now = now
    end

    def call
      bill = BillPolicy.scope(@actor).find_by(id: @bill_id)
      return Result.error("NOT_FOUND", "会計が見つかりません", field: "billId") unless bill && BillPolicy.new(@actor, bill).manage?

      Bill.transaction do
        # 2回押されても、進むのは1回だけ（「今も from の状態なら」を更新の条件に入れる）
        updated = Bill.where(id: bill.id, status: @step[:from]).update_all(status: @step[:to], @step[:at] => @now, updated_at: @now)
        next Result.error("INVALID_STATE", @step[:message]) if updated.zero?

        Audit.bill(actor: @actor, action: @step[:action], bill: bill, now: @now)
        Result.success(bill.reload)
      end
    end
  end
end
