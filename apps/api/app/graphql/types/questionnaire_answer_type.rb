module Types
  class QuestionnaireAnswerType < Types::BaseObject
    graphql_name "QuestionnaireAnswer"
    description "問診の答えの1つ。質問は、答えたときの写し"

    field :question_id, ID, null: false
    field :label, String, null: false
    field :kind, Types::QuestionKindEnum, null: false
    field :options, [ String ], null: false
    field :text, String, description: "文章・選択の答え（複数選択では null）"
    field :selected, [ String ], description: "複数選択の答え（ほかでは null）"

    # object は、暗号を解いた JSON の1件（Hash）
    def question_id = object["question_id"]

    def label = object["label"]

    def kind = object["kind"]

    def options = object["options"]

    def text = object["value"].is_a?(String) ? object["value"] : nil

    def selected = object["value"].is_a?(Array) ? object["value"] : nil
  end
end
