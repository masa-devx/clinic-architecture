module Resolvers
  class AuditLogs < BaseResolver
    description "監査ログ。新しい順。見られるのは、自院の分を、管理者の事務スタッフだけ（ほかの人には空）"

    type Types::AuditLogType.connection_type, null: false

    KEYS = [
      { sql: "audit_logs.occurred_at", cast: "timestamptz", value: ->(log) { log.occurred_at.utc.iso8601(6) } },
      { sql: "audit_logs.id", cast: "bigint", value: ->(log) { log.id } }
    ].freeze

    def resolve
      Pagination::KeysetConnection.new(AuditLogPolicy.scope(current_user), keys: KEYS, descending: true)
    end
  end
end
