# typed: false

module Types
  class QuestionnaireAnswerInput < Types::BaseInputObject
    description "問診の答えの1つ。文章・選択は text、複数選択は selected に入れる"

    argument :question_id, ID, required: true
    argument :text, String, required: false
    argument :selected, [ String ], required: false
  end
end
