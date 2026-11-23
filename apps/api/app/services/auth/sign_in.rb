# typed: false

# メールアドレスとパスワードでログインする。入口（患者・事務スタッフ・医師）ごとに、その入口の人の中からだけ探す
module Auth
  class SignIn
    def initialize(session:, audience:, email:, password:)
      @session = session
      @audience = audience
      @email = email
      @password = password
    end

    def call
      # authenticate_by は、メールアドレスがなくてもパスワードの計算をして、かかる時間で有無が分からないようにする。
      # ほかの入口の人（患者の入口に医師、など）は、いないのと同じに扱う
      user = Audience.accounts(@audience).authenticate_by(email: @email, password: @password)
      # どちらが違うかは教えない
      return Result.error("INVALID_CREDENTIALS", "メールアドレスかパスワードが違います") unless user

      @session.sign_in(user)
      Result.success(user)
    end
  end
end
