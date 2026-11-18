module Resolvers
  class Dashboard < BaseResolver
    description "日ごと・医師ごとの集計。見られるのは、自院の分を、事務スタッフだけ（ほかの人には空）。期間は31日まで"

    type [ Types::DashboardRowType ], null: false

    argument :from, GraphQL::Types::ISO8601Date, required: true, description: "この日から（日本時間）"
    argument :to, GraphQL::Types::ISO8601Date, required: true, description: "この日まで（日本時間。この日を含む）"

    def resolve(from:, to:)
      return [] unless current_user.is_a?(::StaffMember) && current_user.clerk?

      max = ::Dashboards::DailyQuery::MAX_DAYS
      # 画面は、この範囲でしか送らない。ここは、重い集計を止めるための守り
      unless to >= from && (to - from).to_i < max
        raise GraphQL::ExecutionError.new("期間は、1日から#{max}日までで指定してください", extensions: { code: ErrorCode::BAD_REQUEST })
      end

      ::Dashboards::DailyQuery.new(clinic_id: current_user.clinic_id, from: from, to: to).rows
    end
  end
end
