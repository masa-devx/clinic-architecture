# 画面のオリジン（患者用・事務スタッフ用・医師用の3つ）。GraphQL の入口で、これ以外の Origin からの要求を断る（GraphqlController）
Rails.application.config.x.web_origins =
  ENV.fetch("WEB_ORIGINS", "http://localhost:3000,http://localhost:3010,http://localhost:3020").split(",").map(&:strip)
