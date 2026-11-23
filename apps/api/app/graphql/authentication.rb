# typed: false

# resolver と mutation の入口で、ログインを確かめる。ログインが要らないものだけ、allow_guest! と書く
module Authentication
  def self.included(base)
    base.extend(ClassMethods)
  end

  module ClassMethods
    def allow_guest! = @allow_guest = true

    def allow_guest? = @allow_guest == true
  end

  def ready?(**arguments)
    unless self.class.allow_guest? || current_user
      raise GraphQL::ExecutionError.new("ログインしてください", extensions: { code: ErrorCode::UNAUTHENTICATED })
    end

    super
  end

  def current_user = context[:current_user]

  def now = context[:now]
end
