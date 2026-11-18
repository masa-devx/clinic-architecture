module Types
  class BaseObject < GraphQL::Schema::Object
    field_class Types::BaseField
    connection_type_class Types::BaseConnection
    edge_type_class Types::BaseEdge

    private

    def record(model, id) = dataloader.with(Sources::RecordById, model).load(id)

    # 「見た」を、監査ログに残す（Sources::AuditView が、リクエストの分をまとめて入れる）
    def audit_view(action, clinic_id:, patient_id:, subject:)
      user = context[:current_user]
      dataloader.with(Sources::AuditView, user.class.name, user.id, context[:now])
        .load([ action, clinic_id, patient_id, subject.class.name, subject.id ])
    end
  end
end
