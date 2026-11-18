# 3つの入口（患者・事務スタッフ・医師）のスキーマに共通の設定。
# 入口ごとのスキーマ（PatientApi::Schema など）は、これを継いで、その人が使う query と mutation だけを載せる。
# 型（Types::）・業務の処理（app/services）・認可（app/policies）は、入口をまたいで共有する
class BaseSchema < GraphQL::Schema
  # 同じ種類の読み込みをためて、1回の SQL にまとめる（N+1 を出さない）。
  # `use GraphQL::Dataloader` は、継いだスキーマには引き継がれない（入れ忘れると、まとめ読みが全部エラーになる）ので、継ぐたびに入れる
  def self.inherited(schema)
    super
    schema.use GraphQL::Dataloader
  end

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
