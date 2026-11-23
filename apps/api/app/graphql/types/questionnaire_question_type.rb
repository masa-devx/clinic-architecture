# typed: false

module Types
  class QuestionnaireQuestionType < Types::BaseObject
    graphql_name "QuestionnaireQuestion"
    description "問診の質問"

    field :id, ID, null: false
    field :label, String, null: false
    field :kind, Types::QuestionKindEnum, null: false
    field :options, [ String ], null: false
    field :required, Boolean, null: false
  end
end
