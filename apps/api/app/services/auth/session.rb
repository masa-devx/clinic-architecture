# typed: false

# ログインのセッション。Cookie には合言葉（トークン）だけを入れ、誰のセッションかは DB（sessions）が持つ。
# Cookie のキーとトークンの扱いは、ここだけが知る
#
# 入口（患者・事務スタッフ・医師）ごとに、別々の合言葉を持つ。3つの画面は同じホスト（localhost）で
# ポートだけが違い、Cookie はポートを区別しないので、1つの Cookie の中で、入口ごとのキーに分けている。
# 同じブラウザで、患者と医師の両方にログインしていても、互いを上書きしない
module Auth
  class Session
    LIFETIME = 12.hours

    def initialize(request, audience:, now:)
      @request = request
      @audience = audience
      @now = now
    end

    def current_user
      return nil if token.blank?

      user = ::Session.where("expires_at > ?", @now).find_by(token_digest: digest(token))&.user
      # 役割が変わった人（事務スタッフ → 医師 など）の古いセッションを、前の入口で使わせない
      user if Audience.of(user) == @audience
    end

    def sign_in(user)
      # ログインのたびに、合言葉を作り直す（前の合言葉は、その場で使えなくなる）
      sign_out
      new_token = SecureRandom.urlsafe_base64(32)
      owner = user.is_a?(Patient) ? { patient: user } : { staff_member: user }
      ::Session.create!(token_digest: digest(new_token), expires_at: @now + LIFETIME, **owner)
      @request.session[key] = new_token
    end

    # 行を消すので、控えておいた Cookie の値も、その場で使えなくなる。ほかの入口のログインは、そのまま
    def sign_out
      ::Session.where(token_digest: digest(token)).delete_all if token.present?
      @request.session.delete(key)
    end

    private

    def key = "#{@audience}_token"

    def token = @request.session[key]

    # トークンは十分に長い乱数なので、パスワードのような遅いハッシュは要らない
    def digest(value) = Digest::SHA256.hexdigest(value)
  end
end
