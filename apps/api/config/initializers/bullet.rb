# typed: false

# N+1 の検知。開発ではログに出し、テストでは例外にして落とす
if defined?(Bullet) && (Rails.env.development? || Rails.env.test?)
  Rails.application.config.after_initialize do
    Bullet.enable = true
    Bullet.rails_logger = Rails.env.development?
    Bullet.raise = Rails.env.test?
  end
end
