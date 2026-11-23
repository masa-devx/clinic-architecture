# typed: false

# 事務スタッフ用の入口（POST /graphql/clerk）
module ClerkApi
  class Schema < BaseSchema
    query ClerkApi::QueryType
    mutation ClerkApi::MutationType
  end
end
