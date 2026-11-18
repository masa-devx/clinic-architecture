Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # API の入口は GraphQL の1つだけ
  post "/graphql", to: "graphql#execute"
end
