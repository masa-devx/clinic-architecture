# 事前問診。質問は医療機関ごと。答えは予約ごとに1行で、中身をまるごと暗号にして持つ
class CreateQuestionnaires < ActiveRecord::Migration[8.1]
  def change
    create_table :questionnaire_questions do |t|
      t.references :clinic, null: false, foreign_key: true, index: false
      t.integer :position, null: false
      t.string :label, null: false
      t.string :kind, null: false
      # 選択・複数選択の選択肢（文字の並び）。文章の質問では空
      t.jsonb :options, null: false, default: []
      t.boolean :required, null: false, default: false
      t.timestamps

      t.index [ :clinic_id, :position ], unique: true
      t.check_constraint "kind IN ('text', 'single', 'multiple')", name: "questionnaire_questions_kind_check"
    end

    create_table :questionnaire_responses do |t|
      t.bigint :clinic_id, null: false
      t.references :appointment, null: false, foreign_key: true, index: { unique: true }
      # 質問の写しと答えの JSON を、暗号にしたもの（Active Record Encryption）。
      # 質問をあとで変えても、過去の問診は変わらない。DB の中では、答えを検索・集計できない
      t.text :payload, null: false
      # 提出した日時。NULL のあいだは、途中まで保存した下書き
      t.datetime :submitted_at
      t.timestamps

      t.foreign_key :clinics
    end
  end
end
