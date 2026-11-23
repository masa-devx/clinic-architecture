# typed: false

module Resolvers
  # 入口。入力を受けて、ログインを確かめ、読み取りのクラスを呼んで返す。業務のルールは書かない
  class BaseResolver < GraphQL::Schema::Resolver
    include Authentication

    argument_class Types::BaseArgument
  end
end
