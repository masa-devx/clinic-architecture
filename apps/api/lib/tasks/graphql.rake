namespace :graphql do
  desc "GraphQL のスキーマを schema.graphql に書き出す（画面の型は、ここから作る）"
  task dump: :environment do
    path = Rails.root.join("schema.graphql")
    File.write(path, ClinicSchema.to_definition)
    puts "書き出しました: #{path}"
  end
end
