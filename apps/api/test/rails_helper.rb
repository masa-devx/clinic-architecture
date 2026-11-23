require "spec_helper"
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
abort("本番の環境でテストは走らせません") if Rails.env.production?
require "rspec/rails"

Rails.root.glob("test/support/**/*.rb").sort_by(&:to_s).each { |file| require file }

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods
  config.include GraphqlHelper

  # 1件ごとにトランザクションで包んで、終わったら巻き戻す。本当にコミットして確かめるテストだけ、個別に外す
  config.use_transactional_fixtures = true
  config.filter_rails_from_backtrace!

  config.before { ActionMailer::Base.deliveries.clear }

  # N+1 が出たらテストを落とす（config/initializers/bullet.rb）
  config.before { Bullet.start_request }
  config.after do
    Bullet.perform_out_of_channel_notifications if Bullet.notification?
    Bullet.end_request
  end
end
