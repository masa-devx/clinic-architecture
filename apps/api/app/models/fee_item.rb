# 料金の表の1行（医療機関ごと）
class FeeItem < ApplicationRecord
  belongs_to :clinic
end
