# 問診の質問（医療機関ごと）
class QuestionnaireQuestion < ApplicationRecord
  belongs_to :clinic

  # 値は DB の CHECK と同じにする
  enum :kind, { text: "text", single: "single", multiple: "multiple" }, validate: true
end
