module Resolvers
  class FeeItems < BaseResolver
    description "自院の料金の表（事務スタッフだけ。ほかの人には空）"

    type [ Types::FeeItemType ], null: false

    def resolve
      return [] unless current_user.is_a?(::StaffMember) && current_user.clerk?

      ::FeeItem.where(clinic_id: current_user.clinic_id).order(:id)
    end
  end
end
