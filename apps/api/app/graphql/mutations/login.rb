# typed: false

module Mutations
  class Login < BaseMutation
    description "ログイン。この入口の利用者（患者・事務スタッフ・医師のどれか）としてだけ、ログインできる"
    allow_guest!

    argument :email, String, required: true
    argument :password, String, required: true

    field :viewer, Types::ViewerType

    def resolve(email:, password:)
      result = Auth::SignIn.new(session: context[:session], audience: context[:audience], email: email, password: password).call
      { viewer: result.value, errors: result.errors }
    end
  end
end
