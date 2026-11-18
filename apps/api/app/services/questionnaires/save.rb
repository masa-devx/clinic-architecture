# 問診の答えを保存する。途中まで保存（submit: false）と、提出（submit: true）
module Questionnaires
  class Save
    # answers は { 質問の id（文字）=> 値 }
    def initialize(actor:, appointment_id:, answers:, submit:, now:)
      @actor = actor
      @appointment_id = appointment_id
      @answers = answers
      @submit = submit
      @now = now
    end

    def call
      QuestionnaireResponse.transaction do
        # 予約の行をロックして読む。「診察が始まる前」と確かめたあとに、診察が始まる（StartConsultation の更新）を待たせる。
        # ロックしないと、確かめた直後に始まった診察の途中で、問診が書き換わる
        appointment = AppointmentPolicy.scope(@actor).lock("FOR UPDATE OF appointments").find_by(id: @appointment_id)
        next Result.error("NOT_FOUND", "予約が見つかりません", field: "appointmentId") unless appointment
        next Result.error("NOT_PERMITTED", "問診に答えられるのは、予約した患者だけです（診察が始まる前まで）") unless QuestionnairePolicy.new(@actor, appointment).answer?

        response = QuestionnaireResponse.find_or_initialize_by(appointment_id: appointment.id) { |new| new.clinic_id = appointment.clinic_id }
        questions = QuestionnaireQuestion.where(clinic_id: appointment.clinic_id).order(:position).to_a
        # 一度提出した問診は、「途中まで保存」で直すときも、提出のときと同じに確かめる（必須を空にして、提出済のまま残さない）
        errors = Validator.errors(questions, @answers, submit: @submit || response.submitted?)
        next Result.failure(errors) if errors.any?

        # 質問（文・種類・選択肢）も一緒に写す。質問をあとで変えても、この問診は、答えたときの形のまま読める
        response.payload = JSON.generate("answers" => questions.map { |question| snapshot(question) })
        # 一度提出したら、下書きには戻さない（直して保存しても、提出済のまま）
        response.submitted_at ||= @now if @submit
        response.save!
        Audit.record(
          actor: @actor, action: "questionnaire.save", clinic_id: appointment.clinic_id, patient_id: appointment.patient_id,
          subject: response, now: @now
        )
        Result.success(response)
      end
    rescue ActiveRecord::RecordNotUnique
      # 2つの画面から同時に、最初の保存が来た
      Result.error("CONFLICT", "ほかの画面からの保存とぶつかりました。もう一度、保存してください")
    end

    private

    def snapshot(question)
      {
        "question_id" => question.id.to_s, "label" => question.label, "kind" => question.kind,
        "options" => question.options, "value" => @answers[question.id.to_s]
      }
    end
  end
end
