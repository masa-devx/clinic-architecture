module Types
  class UserErrorType < Types::BaseObject
    graphql_name "UserError"
    description "使う人が直せるエラー。mutation の結果の errors に入る"

    field :code, Types::ErrorCodeEnum, null: false
    field :message, String, null: false, description: "画面にそのまま出せる文"
    field :field, String, description: "入力のどの項目か（あれば）"
  end
end
