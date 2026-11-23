# typed: false

require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_mailer/railtie"
require "action_controller/railtie"
require "action_view/railtie"

Bundler.require(*Rails.groups)

module Api
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks])
    config.api_only = true

    # テストは RSpec で書き、置き場所は test/（.rspec の --default-path）。ジェネレーターも test/ に作る
    config.generators do |g|
      g.test_framework :rspec
      g.fixture_replacement :factory_bot, dir: "test/factories"
    end

    # メールの宛先と本文（名前が入る）を、ログに出さない
    config.action_mailer.logger = nil
    config.action_mailer.delivery_method = :smtp
    # 手元では、送らずに受信箱の代わり（Mailpit）へ渡す。場所は環境変数で渡す（compose.yaml）
    config.action_mailer.smtp_settings = { address: ENV.fetch("SMTP_HOST", "127.0.0.1"), port: ENV.fetch("SMTP_PORT", "1025").to_i }
    config.action_mailer.raise_delivery_errors = true

    # 画面に出す時刻と「今日」の区切りは日本時間。DB には UTC で入る（列の型は timestamptz）
    config.time_zone = "Tokyo"
    config.active_record.default_timezone = :utc

    # Cookie のセッション。API モードでは外れているので、ミドルウェアを足す
    # SameSite=Lax: ほかのサイトからの POST には Cookie が付かない（CSRF の守りの1つ目）
    # Cookie に入れるのは、セッションの合言葉（トークン）だけ。誰のセッションか・期限は、DB（sessions）が持つ（Auth::Session）
    config.session_store :cookie_store,
      key: "_clinic_session",
      same_site: :lax,
      httponly: true,
      secure: Rails.env.production?
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use config.session_store, config.session_options
  end
end
