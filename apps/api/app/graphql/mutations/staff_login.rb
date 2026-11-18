module Mutations
  class StaffLogin < BaseMutation
    description "スタッフ（医師・事務スタッフ）のログイン"
    allow_guest!

    argument :email, String, required: true
    argument :password, String, required: true

    field :viewer, Types::ViewerType

    def resolve(email:, password:)
      result = Auth::SignIn.new(session: context[:session], model: ::StaffMember, email: email, password: password).call
      { viewer: result.value, errors: result.errors }
    end
  end
end
