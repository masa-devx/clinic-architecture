# typed: false

# 診療枠を、曜日・時間帯・1枠の長さ・期間から、まとめて作る
module Slots
  class BulkCreate
    MAX_DAYS = 92
    MAX_SLOTS = 2000
    SLOT_MINUTES = (5..240)
    TIME_FORMAT = /\A([01]\d|2[0-3]):([0-5]\d)\z/

    Created = Data.define(:created_count, :skipped_count)

    def initialize(actor:, doctor_id:, from:, to:, weekdays:, start_time:, end_time:, slot_minutes:, now:)
      @actor = actor
      @doctor_id = doctor_id
      @from = from
      @to = to
      @weekdays = weekdays
      @start_time = start_time
      @end_time = end_time
      @slot_minutes = slot_minutes
      @now = now
    end

    def call
      return Result.error("NOT_PERMITTED", "診療枠を作れるのは、医師と事務スタッフだけです") unless @actor.is_a?(StaffMember)

      # 自院の医師の中から探す。ほかの医療機関の医師は、いても「見つからない」
      doctor = StaffMember.doctor.find_by(id: @doctor_id, clinic_id: @actor.clinic_id)
      return Result.error("NOT_FOUND", "医師が見つかりません", field: "doctorId") unless doctor
      return Result.error("NOT_PERMITTED", "ほかの医師の診療枠は作れません", field: "doctorId") unless SlotPolicy.new(@actor).create_for?(doctor)

      errors = input_errors
      return Result.failure(errors) if errors.any?

      times = Schedule.generate(
        from: @from, to: @to, weekdays: @weekdays, start_minute: minute_of(@start_time), end_minute: minute_of(@end_time),
        slot_minutes: @slot_minutes, time_zone: Time.zone
      ).select { |starts_at, _| starts_at > @now }
      return Result.error("INVALID_INPUT", "作れる枠がありません。期間・曜日・時間帯を見直してください") if times.empty?
      return Result.error("INVALID_INPUT", "一度に作れるのは #{MAX_SLOTS} 枠までです。期間を短くしてください") if times.size > MAX_SLOTS

      Result.success(insert(doctor, times))
    end

    private

    # 1文でまとめて入れる。すでにある枠・時間が重なる枠は、DB の制約に当たった分だけ飛ばす（ON CONFLICT DO NOTHING）
    def insert(doctor, times)
      rows = times.map { |starts_at, ends_at| { clinic_id: doctor.clinic_id, doctor_id: doctor.id, starts_at: starts_at, ends_at: ends_at } }
      inserted = Slot.insert_all(rows, returning: [ :id ])
      Created.new(created_count: inserted.length, skipped_count: rows.size - inserted.length)
    end

    def input_errors
      errors = []
      errors << invalid("from", "開始日は、今日より前にできません") if @from < @now.in_time_zone.to_date
      errors << invalid("to", "終了日は、開始日より前にできません") if @to < @from
      errors << invalid("to", "期間は #{MAX_DAYS} 日までです") if (@to - @from).to_i >= MAX_DAYS
      errors << invalid("weekdays", "曜日を1つ以上選んでください") if @weekdays.empty?
      errors << invalid("weekdays", "曜日は 0（日）〜 6（土）で指定してください") unless @weekdays.all? { |day| (0..6).cover?(day) }
      errors << invalid("slotMinutes", "1枠の長さは #{SLOT_MINUTES.min}〜#{SLOT_MINUTES.max} 分です") unless SLOT_MINUTES.cover?(@slot_minutes)
      errors.concat(time_errors)
      errors
    end

    def time_errors
      errors = []
      errors << invalid("startTime", "開始時刻は HH:MM の形で入れてください") unless @start_time.match?(TIME_FORMAT)
      errors << invalid("endTime", "終了時刻は HH:MM の形で入れてください") unless @end_time.match?(TIME_FORMAT)
      return errors if errors.any?

      errors << invalid("endTime", "終了時刻は、開始時刻より後にしてください") unless minute_of(@end_time) > minute_of(@start_time)
      errors
    end

    def invalid(field, message) = UserError.new(code: "INVALID_INPUT", message: message, field: field)

    def minute_of(time)
      hour, minute = time.split(":").map(&:to_i)
      hour * 60 + minute
    end
  end
end
