# typed: false

# 予約の一覧。見られる予約（AppointmentPolicy.scope）を、枠の開始時刻の順で読む
module Appointments
  class ListQuery
    def initialize(actor:, from: nil, to: nil, doctor_id: nil, status: nil)
      @actor = actor
      @from = from
      @to = to
      @doctor_id = doctor_id
      @status = status
    end

    def relation
      # 並びのキー（枠の開始時刻）を、予約の行と一緒に読んでおく。カーソルを作るときに枠を読み直さないため
      relation = AppointmentPolicy.scope(@actor).joins(:slot).select("appointments.*", "slots.starts_at AS slot_starts_at")
      relation = relation.where("slots.starts_at >= ?", Time.zone.local(@from.year, @from.month, @from.day)) if @from
      relation = relation.where("slots.starts_at < ?", Time.zone.local(@to.year, @to.month, @to.day) + 1.day) if @to
      relation = relation.where(slots: { doctor_id: @doctor_id }) if @doctor_id
      relation = relation.where(appointments: { status: @status }) if @status
      relation
    end

    # Pagination::KeysetConnection に渡す並びのキー（枠の開始時刻 → 予約の id）
    def keys
      [
        { sql: "slots.starts_at", cast: "timestamptz", value: ->(appointment) { appointment.slot_starts_at.utc.iso8601(6) } },
        { sql: "appointments.id", cast: "bigint", value: ->(appointment) { appointment.id } }
      ]
    end
  end
end
