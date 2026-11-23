# typed: false

# 問診の答えを暗号にする鍵。環境変数で渡す（手元とテストは compose.yaml の捨ててよい値。本番は秘密の値）。
# なければ、起動しない（鍵なしで動いて、あとで読めないデータを作らないため）
Rails.application.config.active_record.encryption.then do |encryption|
  encryption.primary_key = ENV.fetch("AR_ENCRYPTION_PRIMARY_KEY")
  encryption.deterministic_key = ENV.fetch("AR_ENCRYPTION_DETERMINISTIC_KEY")
  encryption.key_derivation_salt = ENV.fetch("AR_ENCRYPTION_KEY_DERIVATION_SALT")
end
