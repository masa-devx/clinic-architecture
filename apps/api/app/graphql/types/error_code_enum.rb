# typed: false

module Types
  class ErrorCodeEnum < Types::BaseEnum
    graphql_name "ErrorCode"
    description "使う人が直せるエラーの種類"

    ErrorCode::USER.each { |code, meaning| value code, meaning }
  end
end
