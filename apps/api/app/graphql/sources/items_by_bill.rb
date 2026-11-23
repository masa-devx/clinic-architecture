# typed: false

# 会計ごとの明細を、1回の SQL にまとめて読む
module Sources
  class ItemsByBill < GraphQL::Dataloader::Source
    def fetch(bill_ids)
      items = BillItem.where(bill_id: bill_ids).order(:id).group_by(&:bill_id)
      bill_ids.map { |id| items.fetch(id, []) }
    end
  end
end
