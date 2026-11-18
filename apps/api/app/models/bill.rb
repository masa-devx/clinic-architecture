# 会計。診察（予約）に対する請求。明細と合計を持つ
class Bill < ApplicationRecord
  belongs_to :clinic
  belongs_to :appointment
  has_many :items, class_name: "BillItem", dependent: :delete_all

  # 値は DB の CHECK（bills_status_check）と同じにする。遷移の決まりは要件の6章
  enum :status, { draft: "draft", billed: "billed", paid: "paid", refunded: "refunded" }, validate: true
end
