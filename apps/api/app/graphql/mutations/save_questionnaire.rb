module Mutations
  class SaveQuestionnaire < BaseMutation
    description "問診の答えを保存する。submit が false なら途中まで保存、true なら提出（必須の質問を確かめる）"

    argument :appointment_id, ID, required: true
    argument :answers, [ Types::QuestionnaireAnswerInput ], required: true
    argument :submit, Boolean, required: true

    field :appointment, Types::AppointmentType

    def resolve(appointment_id:, answers:, submit:)
      values = answers.to_h { |answer| [ answer.question_id.to_s, answer.selected || answer.text ] }
      result = Questionnaires::Save.new(actor: current_user, appointment_id: appointment_id, answers: values, submit: submit, now: now).call
      { appointment: result.success? ? result.value.appointment : nil, errors: result.errors }
    end
  end
end
