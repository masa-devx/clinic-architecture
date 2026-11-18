namespace :graphql do
  desc "3つの入口の GraphQL のスキーマを schema/ に書き出す（画面の型は、ここから作る）"
  task dump: :environment do
    GraphqlController::SCHEMAS.each do |audience, schema|
      path = Rails.root.join("schema", "#{audience}.graphql")
      File.write(path, schema.to_definition)
      puts "書き出しました: #{path}"
    end
  end
end
