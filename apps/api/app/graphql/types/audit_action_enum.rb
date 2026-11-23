# typed: false

module Types
  class AuditActionEnum < Types::BaseEnum
    graphql_name "AuditAction"
    description "監査ログに残す操作"

    AuditLog::ACTIONS.each { |action, meaning| value action.tr(".", "_").upcase, meaning, value: action }
  end
end
