# typed: false

# 予約ごとの問診を、1回の SQL にまとめて読む。見せてよいかは、呼ぶ側（AppointmentType）が確かめる
module Sources
  class QuestionnaireByAppointment < GraphQL::Dataloader::Source
    def fetch(appointment_ids)
      responses = QuestionnaireResponse.where(appointment_id: appointment_ids).index_by(&:appointment_id)
      appointment_ids.map { |id| responses[id] }
    end
  end
end
