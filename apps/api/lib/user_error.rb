# typed: true

# 使う人が直せるエラーの1件。code は ErrorCode::USER のキー、field は入力の項目の名前（あれば）
UserError = Data.define(:code, :message, :field) do
  extend T::Sig

  sig { params(code: String, message: String, field: T.nilable(String)).void }
  def initialize(code:, message:, field: nil)
    raise ArgumentError, "知らないエラーのコード: #{code}" unless ErrorCode::USER.key?(code)

    super
  end
end
