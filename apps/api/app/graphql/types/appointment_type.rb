module Types
  class AppointmentType < Types::BaseObject
    graphql_name "Appointment"
    description "予約"

    field :id, ID, null: false
    field :status, Types::AppointmentStatusEnum, null: false
    field :canceled_at, GraphQL::Types::ISO8601DateTime
    field :slot, Types::SlotType, null: false
    field :patient, Types::PatientType, null: false
    field :clinic, Types::ClinicType, null: false
    field :can_cancel, Boolean, null: false, description: "今、ログインしている人がキャンセル・時刻の変更をできるか"
    field :can_check_in, Boolean, null: false, description: "今、ログインしている人が受付できるか"
    field :can_start_consultation, Boolean, null: false
    field :can_finish_consultation, Boolean, null: false
    field :bill, Types::BillType, description: "会計。見られない人（医師、下書きのあいだの患者）と、まだない予約では null"
    field :can_view_questionnaire, Boolean, null: false, description: "今、ログインしている人が問診を見られるか（患者本人と、担当の医師）"
    field :can_answer_questionnaire, Boolean, null: false, description: "今、ログインしている人が問診に答えられるか"
    field :questionnaire, Types::QuestionnaireType, description: "問診の答え。見られない人（事務スタッフなど）と、まだない予約では null"
    field :questionnaire_questions, [ Types::QuestionnaireQuestionType ], null: false, description: "この医療機関の、今の問診の質問。問診を見られない人には空"
    field :booked_by_staff, Boolean, null: false, description: "事務スタッフが、患者の代わりに入れた予約か"

    # 項目を取る所でも認可を確かめる。一覧は AppointmentPolicy.scope で絞っているが、
    # ほかの型からたどって届いたときにも、見られない予約を返さないため
    def self.authorized?(appointment, context)
      user = context[:current_user]
      slot = context.dataloader.with(Sources::RecordById, ::Slot).load(appointment.slot_id)
      super && AppointmentPolicy.new(user, appointment, slot: slot).show?
    end

    def slot = record(::Slot, object.slot_id)

    def patient = record(::Patient, object.patient_id)

    def clinic = record(::Clinic, object.clinic_id)

    def can_check_in
      user = context[:current_user]
      user.is_a?(::Patient) && Appointments::ConsultationRule.check_in_violation(
        status: object.status, starts_at: slot.starts_at, now: context[:now]
      ).nil?
    end

    def can_start_consultation = object.checked_in? && policy.consult?

    def can_finish_consultation = object.in_consultation? && policy.consult?

    def bill
      bill = dataloader.with(Sources::BillByAppointment).load(object.id)
      bill if bill && BillPolicy.new(context[:current_user], bill, patient_id: object.patient_id).show?
    end

    def can_view_questionnaire = questionnaire_policy.show?

    def can_answer_questionnaire = questionnaire_policy.answer?

    def questionnaire
      dataloader.with(Sources::QuestionnaireByAppointment).load(object.id) if questionnaire_policy.show?
    end

    def questionnaire_questions
      questionnaire_policy.show? ? dataloader.with(Sources::QuestionsByClinic).load(object.clinic_id) : []
    end

    def questionnaire_policy = QuestionnairePolicy.new(context[:current_user], object, slot: slot)

    def booked_by_staff = object.booked_by_staff_member_id.present?

    def policy = AppointmentPolicy.new(context[:current_user], object, slot: slot)

    def can_cancel
      user = context[:current_user]
      return false unless policy.cancel?

      Appointments::CancellationRule.violation(
        by_patient: user.is_a?(::Patient), status: object.status, starts_at: slot.starts_at, now: context[:now]
      ).nil?
    end
  end
end
