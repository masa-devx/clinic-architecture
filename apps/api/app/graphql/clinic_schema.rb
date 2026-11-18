class ClinicSchema < GraphQL::Schema
  query Types::QueryType
  mutation Types::MutationType

  # 同じ種類の読み込みをためて、1回の SQL にまとめる（N+1 を出さない）
  use GraphQL::Dataloader

  # 重いクエリを止める。イントロスペクション（スキーマの取得）は深いので、深さの数に入れない
  max_depth 10, count_introspection_fields: false
  max_complexity 2000
  default_page_size 20
  default_max_page_size 50
  validate_max_errors 20

  # 想定していないエラーは、中身を画面に出さず、ログにだけ残す
  rescue_from(StandardError) do |err, _object, _arguments, context, field|
    user = context[:current_user]
    AppLog.error("graphql.#{field&.path || 'unknown'}", err: err, userType: user&.class&.name, userId: user&.id)
    raise GraphQL::ExecutionError.new("サーバーでエラーが起きました。時間をおいて、もう一度試してください", extensions: { code: ErrorCode::INTERNAL })
  end

  # 型の authorized? が false を返したとき。あるかどうかを教えないために、「見つからない」として返す
  def self.unauthorized_object(_error)
    raise GraphQL::ExecutionError.new("見つかりません", extensions: { code: ErrorCode::NOT_FOUND })
  end
end
