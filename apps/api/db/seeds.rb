# 手元とテスト（E2E）で使う、決まった初期データ。何度流しても同じ結果になる
# ログインの情報は、ここだけに書く（E2E も、ここの値を使う）。本番では流さない
abort "初期データは、開発の環境でだけ入れます" unless Rails.env.local?

# テストの DB には入れない（テストは、自分専用のデータを作る。初期データがあると、ファクトリーのメールアドレスとぶつかる）。
# 新しく作ったテストの DB に `bin/rails db:prepare` を流すと、ここが呼ばれる（CI がそう）
if Rails.env.test?
  puts "初期データは、テストの DB には入れません"
  return
end

# 手元だけの捨ててよい値
PASSWORD = "password-for-local-only"

def upsert(model, key, attributes)
  record = model.find_or_initialize_by(key)
  record.update!(attributes)
  record
end

sakura = upsert(Clinic, { name: "さくら内科クリニック" }, {})
momiji = upsert(Clinic, { name: "もみじ皮膚科" }, {})

doctors = [
  upsert(StaffMember, { email: "doctor1@sakura.example" }, { clinic: sakura, name: "佐藤 一郎", role: :doctor, password: PASSWORD }),
  upsert(StaffMember, { email: "doctor2@sakura.example" }, { clinic: sakura, name: "鈴木 花子", role: :doctor, password: PASSWORD }),
  upsert(StaffMember, { email: "doctor1@momiji.example" }, { clinic: momiji, name: "高橋 健", role: :doctor, password: PASSWORD })
]
# 監査ログを見られる、管理者の事務スタッフ
upsert(StaffMember, { email: "clerk1@sakura.example" }, { clinic: sakura, name: "田中 美咲", role: :clerk, admin: true, password: PASSWORD })
upsert(StaffMember, { email: "clerk1@momiji.example" }, { clinic: momiji, name: "伊藤 翔", role: :clerk, password: PASSWORD })

# 料金の表（医療機関ごと）
[ sakura, momiji ].each do |clinic|
  { "初診料" => 2_880, "再診料" => 730, "処方箋料" => 680, "オンライン診療のシステム利用料" => 1_000 }.each do |name, unit_price|
    upsert(FeeItem, { clinic: clinic, name: name }, { unit_price: unit_price })
  end
end

# 問診の質問（医療機関ごと）
[ sakura, momiji ].each do |clinic|
  [
    { label: "今日は、どのような症状でお困りですか", kind: :text, options: [], required: true },
    { label: "症状は、いつからですか", kind: :single, options: %w[今日 2〜3日前 1週間以上前], required: true },
    { label: "当てはまるものを、すべて選んでください", kind: :multiple, options: %w[発熱 せき のどの痛み 頭痛], required: false },
    { label: "医師に伝えたいこと", kind: :text, options: [], required: false }
  ].each_with_index do |attributes, index|
    upsert(QuestionnaireQuestion, { clinic: clinic, position: index + 1 }, attributes)
  end
end

upsert(Patient, { email: "patient1@example.com" }, { name: "山田 太郎", password: PASSWORD })
# E2E 専用の患者。E2E が作った予約がたまらないように、流すたびに、この患者の予約を消す
e2e_patient = upsert(Patient, { email: "patient2@example.com" }, { name: "中村 さくら", password: PASSWORD })
# 監査ログは、モデルからは消せない。初期データを決まった状態に戻すときだけ、SQL で直接消す
AuditLog.where(patient: e2e_patient).delete_all
QuestionnaireResponse.where(appointment: Appointment.where(patient: e2e_patient)).delete_all
OutboxMessage.where(appointment: Appointment.where(patient: e2e_patient)).delete_all
Bill.where(appointment: Appointment.where(patient: e2e_patient)).destroy_all
Appointment.where(patient: e2e_patient).delete_all
# E2E は、受付〜会計を通すために「今日の、数分後に始まる枠」を作る。予約のなくなった今日の枠を消して、次の実行とぶつからないようにする
Slot.where(starts_at: Time.current.all_day).where.missing(:appointments).delete_all
# E2E が閉じた枠も、開け直す（手元で閉じた枠も開くが、初期データは「決まった状態に戻す」ためのもの）
Slot.where.not(closed_at: nil).update_all(closed_at: nil)

# 明日から14日分、平日の 9:00〜12:00 に30分の枠を作る。すでにある枠は飛ばす
now = Time.current
doctors.each do |doctor|
  times = Slots::Schedule.generate(
    from: now.to_date + 1, to: now.to_date + 14, weekdays: [ 1, 2, 3, 4, 5 ],
    start_minute: 9 * 60, end_minute: 12 * 60, slot_minutes: 30, time_zone: Time.zone
  )
  rows = times.map { |starts_at, ends_at| { clinic_id: doctor.clinic_id, doctor_id: doctor.id, starts_at: starts_at, ends_at: ends_at } }
  Slot.insert_all(rows)
end

puts "初期データ: 医療機関 #{Clinic.count}・スタッフ #{StaffMember.count}・患者 #{Patient.count}・診療枠 #{Slot.count}・料金の項目 #{FeeItem.count}"
