# typed: false

module Types
  class BillStatusEnum < Types::BaseEnum
    graphql_name "BillStatus"

    value "DRAFT", "作成中", value: "draft"
    value "BILLED", "請求済", value: "billed"
    value "PAID", "支払い済", value: "paid"
    value "REFUNDED", "返金済", value: "refunded"
  end
end
