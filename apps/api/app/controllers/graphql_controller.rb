# GraphQL の入口。リクエストを受けて、ログインしている人を決め、スキーマに渡す
class GraphqlController < ApplicationController
  before_action :reject_other_origins
  before_action :require_json

  def execute
    # now は、1つのリクエストの中で同じ時刻を使うために、ここで1回だけ決める
    now = Time.current
    auth_session = Auth::Session.new(request, now: now)
    result = ClinicSchema.execute(
      params[:query],
      variables: variables,
      operation_name: params[:operationName],
      context: { current_user: auth_session.current_user, session: auth_session, now: now }
    )
    render json: result
  end

  private

  def variables
    value = params[:variables]
    value.respond_to?(:to_unsafe_h) ? value.to_unsafe_h : {}
  end

  # CSRF の守りの2つ目。ブラウザは、別のサイトからの POST に必ず Origin を付ける。画面のオリジン以外は断る
  # Origin がない要求（サーバーの中からの呼び出し・コマンド）は、Cookie を勝手に送るブラウザではないので通す
  def reject_other_origins
    origin = request.headers["Origin"]
    head :forbidden if origin.present? && origin != Rails.configuration.x.web_origin
  end

  # CSRF の守りの3つ目。HTML のフォームからは送れない JSON だけを受ける
  def require_json
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
