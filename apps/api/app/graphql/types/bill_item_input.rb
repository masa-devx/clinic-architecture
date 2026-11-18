module Types
  class BillItemInput < Types::BaseInputObject
    description "会計の明細の1行（料金の表の項目と、数量）"

    argument :fee_item_id, ID, required: true
    argument :quantity, Integer, required: true
  end
end
