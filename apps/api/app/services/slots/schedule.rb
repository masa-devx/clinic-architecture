# 曜日と時間帯から、診療枠の時刻の並びを作る。DB も時計も読まない
module Slots
  module Schedule
    module_function

    # 戻り値は [開始, 終了] の並び。時間帯の終わりに半端が残るときは、その分の枠は作らない
    #   weekdays: 0（日）〜 6（土）
    #   start_minute・end_minute: その日の0時からの分（9:00 なら 540）
    def generate(from:, to:, weekdays:, start_minute:, end_minute:, slot_minutes:, time_zone:)
      (from..to).select { |date| weekdays.include?(date.wday) }.flat_map do |date|
        midnight = time_zone.local(date.year, date.month, date.day)
        start_minute.step(end_minute - slot_minutes, slot_minutes).map do |minute|
          [ midnight + minute.minutes, midnight + (minute + slot_minutes).minutes ]
        end
      end
    end
  end
end
