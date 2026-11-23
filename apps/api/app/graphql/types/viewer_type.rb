# typed: false

module Types
  class ViewerType < Types::BaseObject
    graphql_name "Viewer"
    description "ログインしている人"

    field :id, ID, null: false
    field :kind, Types::ViewerKindEnum, null: false
    field :name, String, null: false
    field :clinic, Types::ClinicType, description: "所属の医療機関（患者は null）"
    field :can_view_audit_logs, Boolean, null: false, description: "監査ログを見られるか（管理者の事務スタッフ）"
    field :staff_member_id, ID, description: "スタッフとしての id（患者は null）。医師が自分の枠・予約を絞るのに使う"

    # 患者とスタッフは別の表なので、種類を前に付けて、同じ番号でもぶつからないようにする
    def id = "#{object.class.name}-#{object.id}"

    def kind
      return "PATIENT" if object.is_a?(::Patient)

      object.doctor? ? "DOCTOR" : "CLERK"
    end

    def clinic
      record(::Clinic, object.clinic_id) if object.is_a?(::StaffMember)
    end

    def can_view_audit_logs = AuditLogPolicy.viewer?(object)

    def staff_member_id
      object.id if object.is_a?(::StaffMember)
    end
  end
end
