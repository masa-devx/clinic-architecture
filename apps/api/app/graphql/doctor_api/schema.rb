# 医師用の入口（POST /graphql/doctor）
module DoctorApi
  class Schema < BaseSchema
    query DoctorApi::QueryType
    mutation DoctorApi::MutationType
  end
end
