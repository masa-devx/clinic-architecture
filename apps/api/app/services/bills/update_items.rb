# typed: false

# 会計の下書きの明細を、入れ直す（料金の表から選んだ項目と数量）
module Bills
  class UpdateItems
    MAX_ITEMS = 50
    QUANTITY = (1..99)

    # items は { fee_item_id:, quantity: } の並び
    def initialize(actor:, bill_id:, items:, now:)
      @actor = actor
      @bill_id = bill_id
      @items = items
      @now = now
    end

    def call
      Bill.transaction do
        # 会計の行をロックする。確定の処理と同時に来ても、「確定したあとに明細が変わる」が起きない
        bill = BillPolicy.scope(@actor).lock.find_by(id: @bill_id)
        next Result.error("NOT_FOUND", "会計が見つかりません", field: "billId") unless bill && BillPolicy.new(@actor, bill).manage?
        next Result.error("INVALID_STATE", "確定した会計の明細は、変えられません") unless bill.draft?
        next Result.error("INVALID_INPUT", "明細は #{MAX_ITEMS} 行までです", field: "items") if @items.size > MAX_ITEMS
        unless @items.all? { |item| QUANTITY.cover?(item[:quantity]) }
          next Result.error("INVALID_INPUT", "数量は #{QUANTITY.min}〜#{QUANTITY.max} で入れてください", field: "items")
        end

        # 自院の料金の表から探す。ほかの医療機関の項目は「見つからない」
        fee_items = FeeItem.where(clinic_id: bill.clinic_id, id: @items.map { |item| item[:fee_item_id] }).index_by { |fee_item| fee_item.id.to_s }
        next Result.error("NOT_FOUND", "料金の項目が見つかりません", field: "items") unless @items.all? { |item| fee_items.key?(item[:fee_item_id].to_s) }

        bill.items.delete_all
        rows = @items.map do |item|
          fee_item = fee_items.fetch(item[:fee_item_id].to_s)
          # 名前と値段を、今の料金の表から写す。あとで料金の表を変えても、この会計は変わらない
          { bill_id: bill.id, name: fee_item.name, unit_price: fee_item.unit_price, quantity: item[:quantity] }
        end
        BillItem.insert_all!(rows) if rows.any?
        bill.touch(time: @now)
        Audit.bill(actor: @actor, action: "bill.update_items", bill: bill, now: @now)
        Result.success(bill)
      end
    end
  end
end
