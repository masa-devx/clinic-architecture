# 実行計画を読むための、大量のデータ（課題 E-1）。中身と考え方は lib/bulk_data.rb
#   入れる: bin/rails bulk:load                     （予約 100万件。前に入れた計測用のデータは消してから入れる）
#   小さく: bin/rails bulk:load APPOINTMENTS=10000
#   消す:   bin/rails bulk:clear
namespace :bulk do
  desc "計測用の大量のデータを入れる（既定は予約100万件。APPOINTMENTS などで変えられる）"
  task load: :environment do
    puts "計測用のデータを入れます"
    counts = BulkData.from_env.load
    puts "入りました"
    counts.each { |label, count| puts format("  %10d 件  %s", count, label) }
    puts "ログイン（事務スタッフ用 http://localhost:3010）: clerk1@#{BulkData::EMAIL_DOMAIN}（大きな医療機関）／ #{BulkData::PASSWORD}"
  end

  desc "計測用の大量のデータを消す"
  task clear: :environment do
    BulkData.from_env.clear
    puts "消しました"
  end
end
