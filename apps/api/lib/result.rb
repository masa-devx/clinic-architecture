# typed: true

# 業務の処理の結果。成功なら value、失敗なら errors（UserError の並び）を持つ
class Result
  extend T::Sig

  # value の中身は、処理ごとに違う（予約・会計・問診・作った枠の数）。呼ぶ側（mutation）が、その処理の型として読む
  sig { returns(T.untyped) }
  attr_reader :value

  sig { returns(T::Array[UserError]) }
  attr_reader :errors

  # value は、上の attr_reader と同じ理由で型を決めない（以下も同じ）
  sig { params(value: T.untyped).returns(Result) }
  def self.success(value = nil) = new(value: value, errors: [])

  sig { params(errors: T.any(UserError, T::Array[UserError])).returns(Result) }
  def self.failure(errors) = new(value: nil, errors: Array(errors))

  sig { params(code: String, message: String, field: T.nilable(String)).returns(Result) }
  def self.error(code, message, field: nil) = failure(UserError.new(code: code, message: message, field: field))

  sig { params(value: T.untyped, errors: T::Array[UserError]).void }
  def initialize(value:, errors:)
    @value = value
    @errors = errors.freeze
  end

  sig { returns(T::Boolean) }
  def success? = errors.empty?
end
