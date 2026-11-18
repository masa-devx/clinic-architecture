# 画面のオリジン。GraphQL の入口で、これ以外の Origin からの要求を断る（GraphqlController）
Rails.application.config.x.web_origin = ENV.fetch("WEB_ORIGIN", "http://localhost:3000")
