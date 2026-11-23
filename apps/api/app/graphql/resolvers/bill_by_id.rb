# typed: false

module Resolvers
  class BillById < BaseResolver
    description "会計の1件。事務スタッフは自院の会計、患者は自分の確定した会計"

    type Types::BillType, null: true

    argument :id, ID, required: true

    def resolve(id:) = BillPolicy.scope(current_user).find_by(id: id)
  end
end
