# typed: false

Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # API の入口は GraphQL だけ。利用者の種類（患者・事務スタッフ・医師）ごとに、入口とスキーマを分けている
  post "/graphql/:audience", to: "graphql#execute", constraints: { audience: Regexp.union(Audience::ALL) }
end
