# typed: true

# 会計を確定する（作成中 → 請求済）。合計を、このときの明細から決める。確定したあとは変えられない
module Bills
  class Confirm
    extend T::Sig

    sig { params(actor: T.any(Patient, StaffMember), bill_id: T.any(Integer, String), now: ActiveSupport::TimeWithZone).void }
    def initialize(actor:, bill_id:, now:)
      @actor = actor
      @bill_id = bill_id
      @now = now
    end

    sig { returns(Result) }
    def call
      Bill.transaction do
        # 明細を入れ直す処理と待ち合うように、会計の行をロックする
        bill = BillPolicy.scope(@actor).lock.find_by(id: @bill_id)
        next Result.error("NOT_FOUND", "会計が見つかりません", field: "billId") unless bill && BillPolicy.new(@actor, bill).manage?
        next Result.error("INVALID_STATE", "この会計は、すでに確定しています") unless bill.draft?
        next Result.error("INVALID_INPUT", "明細を1行以上入れてください", field: "items") unless bill.items.exists?

        bill.update!(status: :billed, total_amount: bill.items.sum("unit_price * quantity"), billed_at: @now)
        Audit.bill(actor: @actor, action: "bill.confirm", bill: bill, now: @now)
        Result.success(bill)
      end
    end
  end
end
