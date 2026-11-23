# 実行計画を読むための、大量のデータ（課題 E-1）。手元の開発の DB にだけ入れる。
#
# - 初期データ（db/seeds.rb）とは別の、「計測用クリニック」に入れる。初期データの医療機関・E2E には影響しない
# - 1院だけ医師が多い（偏り）。偏りで実行計画が変わるのを見られるようにする
# - モデルを1件ずつ保存せず、SQL の generate_series でまとめて入れる（100万件を1件ずつ保存すると、何十分もかかる）。
#   そのため、モデルの検証・コールバック（通知の outbox・監査ログ）は通らない。DB の制約（CHECK・外部キー・排他制約）は通る
# - 乱数の種を決めているので、同じ引数なら、同じ分布になる
class BulkData
  CLINIC_NAME_PREFIX = "計測用クリニック"
  EMAIL_DOMAIN = "bulk.example"
  # 1枠は30分。9:00〜17:00 に16枠
  SLOTS_PER_DAY = 16
  # 今日から先に、何日分の枠を作るか（残りは過去の枠）。件数が少なくて日数が短いときは、全体の4分の1まで。
  # ただし、今日と明日の2日は必ず作る（今日だけだと、夕方に流したとき、今日の枠がすべて過去になり、先の予約が1件もできない）
  FUTURE_DAYS = 30
  MIN_FUTURE_DAYS = 2
  # 枠の何割に予約が入っているか（id の下1桁が0の枠は、空きのまま）
  BOOKED_SHARE = 0.9
  # 手元だけの捨ててよい値（初期データと同じ）
  PASSWORD = "password-for-local-only"

  # 件数は、環境変数で変えられる（bin/rails bulk:load APPOINTMENTS=10000 など）
  def self.from_env(env = ENV)
    abort "計測用のデータは、開発の環境でだけ入れます" unless Rails.env.development?

    new(
      appointments: Integer(env.fetch("APPOINTMENTS", "1000000")),
      patients: Integer(env.fetch("PATIENTS", "100000")),
      clinics: Integer(env.fetch("CLINICS", "20")),
      doctors_per_clinic: Integer(env.fetch("DOCTORS_PER_CLINIC", "4")),
      doctors_in_big_clinic: Integer(env.fetch("DOCTORS_IN_BIG_CLINIC", "30"))
    )
  end

  def initialize(appointments:, patients:, clinics:, doctors_per_clinic:, doctors_in_big_clinic:, seed: 0.42)
    @appointments = appointments
    @patients = patients
    @clinics = clinics
    @doctors_per_clinic = doctors_per_clinic
    @doctors_in_big_clinic = doctors_in_big_clinic
    @password = PASSWORD
    @seed = seed
  end

  # vacuum: false は、テスト用（テストは1つのトランザクションの中で走り、その中では VACUUM を流せない）
  def load(vacuum: true)
    clear
    ActiveRecord::Base.transaction do
      # random() の種。同じトランザクション（同じ接続）の中で効く
      execute("SELECT setseed(#{Float(@seed)})")
      step("医療機関・スタッフ・料金の表") { insert_clinics_and_staff }
      step("患者") { insert_patients }
      step("診療枠") { insert_slots }
      step("予約") { insert_appointments }
      step("会計と明細") { insert_bills }
    end
    # 統計情報を新しくしないと、実行計画が「表は空」と思って選ばれる。VACUUM は、トランザクションの外で流す
    if vacuum
      step("統計情報（VACUUM ANALYZE）") do
        %w[clinics staff_members patients slots appointments bills bill_items fee_items].each { |table| execute("VACUUM (ANALYZE) #{table}") }
      end
    end
    counts
  end

  # 前に入れた計測用のデータを消す。画面から操作して増えた行（セッション・監査ログ・問診・通知）も一緒に消す
  def clear
    clinic_ids = "SELECT id FROM clinics WHERE name LIKE #{quote("#{CLINIC_NAME_PREFIX}%")}"
    patient_ids = "SELECT id FROM patients WHERE email LIKE #{quote("%@#{EMAIL_DOMAIN}")}"
    staff_ids = "SELECT id FROM staff_members WHERE clinic_id IN (#{clinic_ids})"
    appointment_ids = "SELECT id FROM appointments WHERE clinic_id IN (#{clinic_ids})"
    step("前の計測用のデータを消す") do
      [
        "DELETE FROM bill_items WHERE bill_id IN (SELECT id FROM bills WHERE clinic_id IN (#{clinic_ids}))",
        "DELETE FROM bills WHERE clinic_id IN (#{clinic_ids})",
        "DELETE FROM outbox_messages WHERE appointment_id IN (#{appointment_ids})",
        "DELETE FROM questionnaire_responses WHERE clinic_id IN (#{clinic_ids})",
        "DELETE FROM audit_logs WHERE clinic_id IN (#{clinic_ids}) OR patient_id IN (#{patient_ids})",
        "DELETE FROM sessions WHERE patient_id IN (#{patient_ids}) OR staff_member_id IN (#{staff_ids})",
        "DELETE FROM appointments WHERE clinic_id IN (#{clinic_ids})",
        "DELETE FROM slots WHERE clinic_id IN (#{clinic_ids})",
        "DELETE FROM questionnaire_questions WHERE clinic_id IN (#{clinic_ids})",
        "DELETE FROM fee_items WHERE clinic_id IN (#{clinic_ids})",
        "DELETE FROM staff_members WHERE clinic_id IN (#{clinic_ids})",
        "DELETE FROM patients WHERE id IN (#{patient_ids})",
        "DELETE FROM clinics WHERE id IN (#{clinic_ids})"
      ].each { |sql| execute(sql) }
    end
  end

  def counts
    clinic_ids = "SELECT id FROM clinics WHERE name LIKE #{quote("#{CLINIC_NAME_PREFIX}%")}"
    {
      "医療機関" => "SELECT count(*) FROM clinics WHERE id IN (#{clinic_ids})",
      "医師" => "SELECT count(*) FROM staff_members WHERE clinic_id IN (#{clinic_ids}) AND role = 'doctor'",
      "患者" => "SELECT count(*) FROM patients WHERE email LIKE #{quote("%@#{EMAIL_DOMAIN}")}",
      "診療枠" => "SELECT count(*) FROM slots WHERE clinic_id IN (#{clinic_ids})",
      "予約" => "SELECT count(*) FROM appointments WHERE clinic_id IN (#{clinic_ids})",
      "会計" => "SELECT count(*) FROM bills WHERE clinic_id IN (#{clinic_ids})"
    }.transform_values { |sql| connection.select_value(sql).to_i }
  end

  private

  def insert_clinics_and_staff
    execute(<<~SQL)
      INSERT INTO clinics (name, created_at, updated_at)
      SELECT format('%s %s', #{quote(CLINIC_NAME_PREFIX)}, lpad(i::text, 2, '0')), now(), now()
      FROM generate_series(1, #{Integer(@clinics)}) AS i
    SQL
    # パスワードの暗号（bcrypt）は重いので、1回だけ作って、全員で同じものを使う
    digest = quote(BCrypt::Password.create(@password, cost: BCrypt::Engine::MIN_COST))
    # 医療機関の番号（01〜）。01 だけが、医師の多い大きな医療機関
    numbered = <<~SQL
      SELECT id, row_number() OVER (ORDER BY id) AS no FROM clinics WHERE name LIKE #{quote("#{CLINIC_NAME_PREFIX}%")}
    SQL
    execute(<<~SQL)
      INSERT INTO staff_members (clinic_id, email, password_digest, name, role, admin, created_at, updated_at)
      SELECT c.id, format('doctor%s-%s@%s', c.no, d, #{quote(EMAIL_DOMAIN)}), #{digest}, format('計測 医師%s-%s', c.no, d), 'doctor', false, now(), now()
      FROM (#{numbered}) AS c
      CROSS JOIN LATERAL generate_series(1, CASE WHEN c.no = 1 THEN #{Integer(@doctors_in_big_clinic)} ELSE #{Integer(@doctors_per_clinic)} END) AS d
    SQL
    # 事務スタッフ（管理者）を、医療機関に1人。この人でログインすると、その医療機関の一覧・ダッシュボードを開ける
    execute(<<~SQL)
      INSERT INTO staff_members (clinic_id, email, password_digest, name, role, admin, created_at, updated_at)
      SELECT c.id, format('clerk%s@%s', c.no, #{quote(EMAIL_DOMAIN)}), #{digest}, format('計測 事務%s', c.no), 'clerk', true, now(), now()
      FROM (#{numbered}) AS c
    SQL
    execute(<<~SQL)
      INSERT INTO fee_items (clinic_id, name, unit_price, created_at, updated_at)
      SELECT c.id, item.name, item.price, now(), now()
      FROM (#{numbered}) AS c
      CROSS JOIN (VALUES ('初診料', 2910), ('再診料', 750), ('処方箋料', 680)) AS item(name, price)
    SQL
  end

  def insert_patients
    digest = quote(BCrypt::Password.create(@password, cost: BCrypt::Engine::MIN_COST))
    execute(<<~SQL)
      INSERT INTO patients (email, password_digest, name, created_at, updated_at)
      SELECT format('patient%s@%s', i, #{quote(EMAIL_DOMAIN)}), #{digest}, format('計測 患者%s', i), t, t
      FROM generate_series(1, #{Integer(@patients)}) AS i
      CROSS JOIN LATERAL (SELECT now() - random() * interval '730 days' AS t) AS created
    SQL
  end

  # 医師ごとに、同じ日数の枠を作る。予約の件数に足りる日数を、過去へさかのぼって作る
  def insert_slots
    doctors = (@clinics - 1) * @doctors_per_clinic + @doctors_in_big_clinic
    slots_per_doctor = (@appointments / BOOKED_SHARE / doctors).ceil
    days = (slots_per_doctor.to_f / SLOTS_PER_DAY).ceil
    future_days = (days / 4).clamp(MIN_FUTURE_DAYS, FUTURE_DAYS)
    first_day = future_days - days
    last_day = future_days - 1
    execute(<<~SQL)
      INSERT INTO slots (clinic_id, doctor_id, starts_at, ends_at, created_at, updated_at)
      SELECT s.clinic_id, s.id, t.starts_at, t.starts_at + interval '30 minutes', t.starts_at - interval '60 days', t.starts_at - interval '60 days'
      FROM staff_members AS s
      CROSS JOIN LATERAL (
        -- 日本時間の日付と時刻を作ってから、時刻つきの値（timestamptz）に直す
        SELECT (((now() AT TIME ZONE 'Asia/Tokyo')::date + d) + time '09:00' + k * interval '30 minutes') AT TIME ZONE 'Asia/Tokyo' AS starts_at
        FROM generate_series(#{Integer(first_day)}, #{Integer(last_day)}) AS d
        CROSS JOIN generate_series(0, #{SLOTS_PER_DAY - 1}) AS k
      ) AS t
      WHERE s.role = 'doctor' AND s.email LIKE #{quote("%@#{EMAIL_DOMAIN}")}
    SQL
  end

  # 過去の枠: 診察済 88%・キャンセル 8%・無断キャンセル 4%。今より後の枠: 予約済 88%・キャンセル 12%
  def insert_appointments
    patient_range = connection.select_one(<<~SQL)
      SELECT min(id) AS first, count(*) AS count FROM patients WHERE email LIKE #{quote("%@#{EMAIL_DOMAIN}")}
    SQL
    execute(<<~SQL)
      INSERT INTO appointments (
        clinic_id, slot_id, patient_id, status, created_at, updated_at,
        canceled_at, checked_in_at, started_at, completed_at, no_show_at
      )
      SELECT
        x.clinic_id, x.id, x.patient_id, st.status, x.booked_at, x.booked_at,
        CASE WHEN st.status = 'canceled' THEN x.booked_at + random() * (LEAST(x.starts_at, now()) - x.booked_at) END,
        CASE WHEN st.status = 'completed' THEN x.starts_at - interval '5 minutes' END,
        CASE WHEN st.status = 'completed' THEN x.starts_at END,
        CASE WHEN st.status = 'completed' THEN x.starts_at + interval '20 minutes' END,
        CASE WHEN st.status = 'no_show' THEN x.starts_at + interval '15 minutes' END
      FROM (
        SELECT
          sl.id, sl.clinic_id, sl.starts_at,
          #{Integer(patient_range['first'])} + floor(random() * #{Integer(patient_range['count'])})::bigint AS patient_id,
          random() AS r,
          -- 予約した時刻は、枠の1〜30日前。ただし、今より後にはしない
          LEAST(sl.starts_at - (1 + random() * 29) * interval '1 day', now()) AS booked_at
        FROM slots AS sl
        WHERE sl.clinic_id IN (SELECT id FROM clinics WHERE name LIKE #{quote("#{CLINIC_NAME_PREFIX}%")})
          AND sl.id % 10 <> 0
        -- 件数で打ち切るときは、いちばん先の日時の枠から外す（先の予約ほど、まだ入っていない）
        ORDER BY sl.starts_at, sl.id
        LIMIT #{Integer(@appointments)}
      ) AS x
      CROSS JOIN LATERAL (
        SELECT CASE
          WHEN x.starts_at < now() THEN CASE WHEN x.r < 0.08 THEN 'canceled' WHEN x.r < 0.12 THEN 'no_show' ELSE 'completed' END
          ELSE CASE WHEN x.r < 0.12 THEN 'canceled' ELSE 'booked' END
        END AS status
      ) AS st
    SQL
  end

  # 診察済の予約に、会計を1つ。支払い済 93%・請求済（未払い）5%・返金済 2%
  def insert_bills
    execute(<<~SQL)
      INSERT INTO bills (clinic_id, appointment_id, status, total_amount, billed_at, paid_at, refunded_at, created_at, updated_at)
      SELECT
        a.clinic_id, a.id, st.status, a.amount, a.completed_at,
        CASE WHEN st.status IN ('paid', 'refunded') THEN a.completed_at + interval '10 minutes' END,
        CASE WHEN st.status = 'refunded' THEN a.completed_at + interval '1 day' END,
        a.completed_at, a.completed_at
      FROM (
        SELECT ap.*, random() AS r, (ARRAY[750, 1430, 2910, 3590])[1 + floor(random() * 4)::int] AS amount
        FROM appointments AS ap
        WHERE ap.status = 'completed'
          AND ap.clinic_id IN (SELECT id FROM clinics WHERE name LIKE #{quote("#{CLINIC_NAME_PREFIX}%")})
      ) AS a
      CROSS JOIN LATERAL (
        SELECT CASE WHEN a.r < 0.02 THEN 'refunded' WHEN a.r < 0.07 THEN 'billed' ELSE 'paid' END AS status
      ) AS st
    SQL
    execute(<<~SQL)
      INSERT INTO bill_items (bill_id, name, unit_price, quantity, created_at, updated_at)
      SELECT b.id, '診察料', b.total_amount, 1, b.created_at, b.created_at
      FROM bills AS b
      WHERE b.clinic_id IN (SELECT id FROM clinics WHERE name LIKE #{quote("#{CLINIC_NAME_PREFIX}%")})
    SQL
  end

  def step(label)
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    result = yield
    puts format("  %6.1f 秒  %s", Process.clock_gettime(Process::CLOCK_MONOTONIC) - started, label)
    result
  end

  def execute(sql) = connection.execute(sql)
  def quote(value) = connection.quote(value)
  def connection = ActiveRecord::Base.connection
end
