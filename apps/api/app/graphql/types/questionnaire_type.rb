module Types
  class QuestionnaireType < Types::BaseObject
    graphql_name "Questionnaire"
    description "問診の答え（予約ごとに1つ）"

    field :id, ID, null: false
    field :submitted, Boolean, null: false, description: "提出済か（false は、途中まで保存した下書き）"
    field :submitted_at, GraphQL::Types::ISO8601DateTime
    field :answers, [ Types::QuestionnaireAnswerType ], null: false

    # 見せてよいかは、たどってくる元（AppointmentType#questionnaire）が、QuestionnairePolicy で確かめる。
    # ここへは、そこからしか届かない
    def submitted = object.submitted?

    # 答えを読んだ、を残す（提出済かどうかだけを見たときは、残さない）
    def answers
      appointment = dataloader.with(Sources::RecordById, ::Appointment).load(object.appointment_id)
      audit_view("questionnaire.view", clinic_id: object.clinic_id, patient_id: appointment.patient_id, subject: object)
      object.answers
    end
  end
end
