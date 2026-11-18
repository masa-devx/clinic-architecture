# GraphQL の入口。入口は、利用者の種類（患者・事務スタッフ・医師）ごとに3つあり、それぞれ別のスキーマを使う。
# リクエストを受けて、その入口にログインしている人を決め、スキーマに渡す
class GraphqlController < ApplicationController
  SCHEMAS = { "patient" => PatientApi::Schema, "clerk" => ClerkApi::Schema, "doctor" => DoctorApi::Schema }.freeze

  before_action :reject_other_origins
  before_action :require_json

  def execute
    # audience は、ルート（config/routes.rb）で3つの値に限っている
    audience = params[:audience]
    # now は、1つのリクエストの中で同じ時刻を使うために、ここで1回だけ決める
    now = Time.current
    auth_session = Auth::Session.new(request, audience: audience, now: now)
    result = SCHEMAS.fetch(audience).execute(
      params[:query],
      variables: variables,
      operation_name: params[:operationName],
      context: { current_user: auth_session.current_user, session: auth_session, audience: audience, now: now }
    )
    render json: result
  end

  private

  def variables
    value = params[:variables]
    value.respond_to?(:to_unsafe_h) ? value.to_unsafe_h : {}
  end

  # CSRF の守りの2つ目。ブラウザは、別のサイトからの POST に必ず Origin を付ける。3つの画面のオリジン以外は断る
  # Origin がない要求（サーバーの中からの呼び出し・コマンド）は、Cookie を勝手に送るブラウザではないので通す
  def reject_other_origins
    origin = request.headers["Origin"]
    head :forbidden if origin.present? && Rails.configuration.x.web_origins.exclude?(origin)
  end

  # CSRF の守りの3つ目。HTML のフォームからは送れない JSON だけを受ける
  def require_json
    head :unsupported_media_type unless request.media_type == "application/json"
  end
end
