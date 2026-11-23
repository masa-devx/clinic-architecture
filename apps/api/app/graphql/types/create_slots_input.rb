# typed: false

module Types
  class CreateSlotsInput < Types::BaseInputObject
    description "診療枠をまとめて作る入力。日付と時刻は日本時間"

    argument :doctor_id, ID, required: true
    argument :from, GraphQL::Types::ISO8601Date, required: true, description: "期間の最初の日"
    argument :to, GraphQL::Types::ISO8601Date, required: true, description: "期間の最後の日（この日を含む）"
    argument :weekdays, [ Integer ], required: true, description: "曜日。0（日）〜 6（土）"
    argument :start_time, String, required: true, description: "時間帯の始まり。HH:MM"
    argument :end_time, String, required: true, description: "時間帯の終わり。HH:MM"
    argument :slot_minutes, Integer, required: true, description: "1枠の長さ（分）"
  end
end
