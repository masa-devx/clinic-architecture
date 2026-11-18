module Types
  class ViewerKindEnum < Types::BaseEnum
    graphql_name "ViewerKind"

    value "PATIENT", "患者"
    value "DOCTOR", "医師"
    value "CLERK", "事務スタッフ"
  end
end
