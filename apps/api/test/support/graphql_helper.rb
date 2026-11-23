# typed: false

module GraphqlHelper
  # スキーマを通して実行する（HTTP は通さない）。想定していないエラーが出たら、その場で落とす。
  # 入口（スキーマ）は、user の種類で決まる。ログインしていない場合などは、audience で指定する
  def execute_graphql(query, variables: {}, user: nil, audience: nil, now: Time.current, expect_errors: false)
    audience ||= Audience.of(user) || "patient"
    schema = GraphqlController::SCHEMAS.fetch(audience)
    result = schema.execute(query, variables: variables.deep_stringify_keys, context: { current_user: user, audience: audience, now: now }).to_h
    raise "GraphQL のエラー: #{result['errors'].inspect}" if result["errors"] && !expect_errors

    result
  end

  # ブロックの中で出た SQL の本数を数える（スキーマの読み込み・トランザクションの制御は数えない）
  def count_queries
    count = 0
    counter = lambda do |_name, _start, _finish, _id, payload|
      count += 1 unless payload[:name] == "SCHEMA" || payload[:sql].match?(/\A(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)/)
    end
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record") { yield }
    count
  end
end
