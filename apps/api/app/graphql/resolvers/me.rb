module Resolvers
  class Me < BaseResolver
    description "ログインしている人。ログインしていなければ null"
    allow_guest!

    type Types::ViewerType, null: true

    def resolve = current_user
  end
end
