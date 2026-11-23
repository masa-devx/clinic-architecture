# typed: false

# 会計の明細。名前と値段は、作った時の料金の表から写したもの
class BillItem < ApplicationRecord
  belongs_to :bill
end
