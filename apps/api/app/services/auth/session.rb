# ログインのセッション。Cookie には合言葉（トークン）だけを入れ、誰のセッションかは DB（sessions）が持つ。
# Cookie のキーとトークンの扱いは、ここだけが知る
module Auth
  class Session
    LIFETIME = 12.hours

    def initialize(request, now:)
      @request = request
      @now = now
    end

    def current_user
      token = @request.session[:token]
      return nil if token.blank?

      ::Session.where("expires_at > ?", @now).find_by(token_digest: digest(token))&.user
    end

    def sign_in(user)
      # ログインの前後で Cookie のセッションを作り直す（ログイン前に仕込まれたセッションを使わせない）
      sign_out
      token = SecureRandom.urlsafe_base64(32)
      owner = user.is_a?(Patient) ? { patient: user } : { staff_member: user }
      ::Session.create!(token_digest: digest(token), expires_at: @now + LIFETIME, **owner)
      @request.session[:token] = token
    end

    # 行を消すので、控えておいた Cookie の値も、その場で使えなくなる
    def sign_out
      token = @request.session[:token]
      ::Session.where(token_digest: digest(token)).delete_all if token.present?
      @request.reset_session
    end

    private

    # トークンは十分に長い乱数なので、パスワードのような遅いハッシュは要らない
    def digest(token) = Digest::SHA256.hexdigest(token)
  end
end
