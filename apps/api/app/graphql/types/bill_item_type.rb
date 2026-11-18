module Types
  class BillItemType < Types::BaseObject
    graphql_name "BillItem"
    description "会計の明細。名前と値段は、作った時の料金の表から写したもの"

    field :id, ID, null: false
    field :name, String, null: false
    field :unit_price, Integer, null: false, description: "円"
    field :quantity, Integer, null: false
    field :amount, Integer, null: false, description: "単価 × 数量（円）"

    def amount = object.unit_price * object.quantity
  end
end
