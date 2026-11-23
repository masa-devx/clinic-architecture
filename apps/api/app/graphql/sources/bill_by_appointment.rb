# typed: false

# 予約ごとの会計を、1回の SQL にまとめて読む。見せてよいかは、呼ぶ側（AppointmentType#bill）が確かめる
module Sources
  class BillByAppointment < GraphQL::Dataloader::Source
    def fetch(appointment_ids)
      bills = Bill.where(appointment_id: appointment_ids).index_by(&:appointment_id)
      appointment_ids.map { |id| bills[id] }
    end
  end
end
