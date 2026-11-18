module Mutations
  # 入口。入力を受けて、ログインを確かめ、業務の処理（app/services）を呼び、結果を形にして返す。業務のルールは書かない
  # 使う人が直せるエラーは、結果の errors に入れて返す（例外にしない）
  class BaseMutation < GraphQL::Schema::Mutation
    include Authentication

    argument_class Types::BaseArgument
    field_class Types::BaseField
    object_class Types::BaseObject

    # 結果は必ず返す（null にしない）。使う人が直せるエラーは、結果の errors に入る
    null false

    # どの mutation の結果にも errors を持たせる。成功なら空
    def self.inherited(subclass)
      super
      subclass.field :errors, [ Types::UserErrorType ], null: false
    end
  end
end
