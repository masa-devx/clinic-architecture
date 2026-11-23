# typed: false

module Types
  class AuditLogType < Types::BaseObject
    graphql_name "AuditLog"
    description "監査ログの1件"

    field :id, ID, null: false
    field :occurred_at, GraphQL::Types::ISO8601DateTime, null: false
    field :action, Types::AuditActionEnum, null: false
    field :actor_kind, Types::ViewerKindEnum, description: "した人の種類。システム（定期の処理）のときは null"
    field :actor_name, String, null: false, description: "した人の名前"
    field :patient_name, String, null: false, description: "どの患者のデータか"
    field :subject, String, null: false, description: "何を（例: 予約 #12）"

    SUBJECTS = { "Appointment" => "予約", "Bill" => "会計", "QuestionnaireResponse" => "問診" }.freeze

    SYSTEM_NAME = "システム（定期の処理）"

    def actor_kind
      return nil if system?
      return "PATIENT" if object.actor_type == "Patient"

      actor.doctor? ? "DOCTOR" : "CLERK"
    end

    def actor_name = system? ? SYSTEM_NAME : actor.name

    def patient_name = record(::Patient, object.patient_id).name

    def subject = "#{SUBJECTS.fetch(object.subject_type)} ##{object.subject_id}"

    private

    def system? = object.actor_type == "System"

    def actor = record(object.actor_type.constantize, object.actor_id)
  end
end
