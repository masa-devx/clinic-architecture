# typed: false

module Mutations
  class Logout < BaseMutation
    description "ログアウト。ログインしていなくても成功する"
    allow_guest!

    def resolve
      context[:session].sign_out
      { errors: [] }
    end
  end
end
