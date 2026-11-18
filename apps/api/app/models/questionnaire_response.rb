# 問診の答え（予約ごとに1つ）。中身は暗号にして持つ
class QuestionnaireResponse < ApplicationRecord
  belongs_to :clinic
  belongs_to :appointment

  # DB に入るのは暗号文。読むときに、鍵（環境変数）で元に戻す
  encrypts :payload

  # 中身は { "answers" => [ { "question_id", "label", "kind", "options", "value" } ] }
  def answers = JSON.parse(payload).fetch("answers")

  def submitted? = submitted_at.present?

  # 中身（答え）を、ログやエラーの文に出さない
  def inspect = "#<QuestionnaireResponse id: #{id.inspect}, appointment_id: #{appointment_id.inspect}>"
end
