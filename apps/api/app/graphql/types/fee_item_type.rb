# typed: false

module Types
  class FeeItemType < Types::BaseObject
    graphql_name "FeeItem"
    description "料金の表の1行"

    field :id, ID, null: false
    field :name, String, null: false
    field :unit_price, Integer, null: false, description: "円"
  end
end
