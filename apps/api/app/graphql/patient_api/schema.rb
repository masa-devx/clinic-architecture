# 患者用の入口（POST /graphql/patient）
module PatientApi
  class Schema < BaseSchema
    query PatientApi::QueryType
    mutation PatientApi::MutationType
  end
end
