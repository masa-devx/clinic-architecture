# 医療機関ごとの問診の質問を、1回の SQL にまとめて読む
module Sources
  class QuestionsByClinic < GraphQL::Dataloader::Source
    def fetch(clinic_ids)
      questions = QuestionnaireQuestion.where(clinic_id: clinic_ids).order(:position).group_by(&:clinic_id)
      clinic_ids.map { |id| questions.fetch(id, []) }
    end
  end
end
