# typed: false

# リクエストのログ（Parameters:）から隠すキー。部分一致で、GraphQL の variables の中にも効く
# 名前（name）は個人情報なので隠す。問診の答え（answers）も隠す。GraphQL では値を必ず variables で渡し、query の文字列に直接書かない
Rails.application.config.filter_parameters += [
  :passw, :email, :name, :answers, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn, :cvv, :cvc
]
