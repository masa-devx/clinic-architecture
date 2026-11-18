# 業務の処理の結果。成功なら value、失敗なら errors（UserError の並び）を持つ
class Result
  attr_reader :value, :errors

  def self.success(value = nil) = new(value: value, errors: [])

  def self.failure(errors) = new(value: nil, errors: Array(errors))

  def self.error(code, message, field: nil) = failure(UserError.new(code: code, message: message, field: field))

  def initialize(value:, errors:)
    @value = value
    @errors = errors.freeze
  end

  def success? = errors.empty?
end
