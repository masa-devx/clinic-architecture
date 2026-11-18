# メールアドレスとパスワードでログインする。患者とスタッフは入口が別なので、探す表を呼ぶ側が決める
module Auth
  class SignIn
    def initialize(session:, model:, email:, password:)
      @session = session
      @model = model
      @email = email
      @password = password
    end

    def call
      # authenticate_by は、メールアドレスがなくてもパスワードの計算をして、かかる時間で有無が分からないようにする
      user = @model.authenticate_by(email: @email, password: @password)
      # どちらが違うかは教えない
      return Result.error("INVALID_CREDENTIALS", "メールアドレスかパスワードが違います") unless user

      @session.sign_in(user)
      Result.success(user)
    end
  end
end
