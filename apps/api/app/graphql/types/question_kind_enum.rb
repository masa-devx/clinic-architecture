module Types
  class QuestionKindEnum < Types::BaseEnum
    graphql_name "QuestionKind"

    value "TEXT", "文章", value: "text"
    value "SINGLE", "選択（1つ）", value: "single"
    value "MULTIPLE", "複数選択", value: "multiple"
  end
end
