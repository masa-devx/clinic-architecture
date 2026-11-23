# typed: true

# カーソルで続きを読む Connection（前へは進まない。first・after だけ）
#
# graphql-ruby の標準は「何件目か」をカーソルにする（OFFSET）。それだと、深いページほど読み捨てる行が増え、
# 途中で行が増えると同じ行が2回出る。ここでは「最後に出した行の並びのキー」をカーソルにして、その続きを条件で読む
#
# keys は並びのキー。最後のキーは一意な列（id）にして、同じ時刻の行でも順番が決まるようにする
#   Pagination::KeysetConnection.new(relation, keys: [
#     { sql: "slots.starts_at", cast: "timestamptz", value: ->(record) { record.starts_at.iso8601(6) } },
#     { sql: "slots.id", cast: "bigint", value: ->(record) { record.id } }
#   cast は timestamptz か bigint。カーソルは画面から来る値なので、SQL に渡す前に、その型として読めるかを確かめる
#   ])
module Pagination
  class KeysetConnection < GraphQL::Pagination::Connection
    extend T::Sig

    # 並びのキーの1つ。value は、行（予約・枠・監査ログなど）から、カーソルに入れる値を取り出す
    Key = T.type_alias { { sql: String, cast: String, value: T.proc.params(record: ActiveRecord::Base).returns(T.any(String, Integer)) } }

    # options は、graphql-ruby の Connection にそのまま渡す（first・after など。graphql-ruby が型を持たないので、型を決めない）
    sig { params(relation: ActiveRecord::Relation, keys: T::Array[Key], descending: T::Boolean, options: T.untyped).void }
    def initialize(relation, keys:, descending: false, **options)
      super(relation, **options)
      @keys = keys
      @descending = descending
    end

    sig { returns(T::Array[ActiveRecord::Base]) }
    def nodes
      load_page
      @nodes
    end

    sig { returns(T::Boolean) }
    def has_next_page
      load_page
      @has_next_page
    end

    # 前へは進まないので、前のページは「after があるか」だけで答える
    sig { returns(T::Boolean) }
    def has_previous_page = after_value.present?

    sig { params(record: ActiveRecord::Base).returns(String) }
    def cursor_for(record)
      encode(JSON.generate(@keys.map { |key| key[:value].call(record) }))
    end

    private

    def load_page
      return if defined?(@nodes)

      # 引数やカーソルが正しくないときは、edges と pageInfo の両方からエラーを出さないように、先に空のページにしておく
      @nodes = []
      @has_next_page = false
      reject_backward_arguments
      limit = first
      # 1件多く読んで、続きがあるかを知る（件数を数える SQL を別に出さない）
      records = page_relation.limit(limit + 1).to_a
      @has_next_page = records.size > limit
      @nodes = records.first(limit)
    end

    def page_relation
      direction = @descending ? "DESC" : "ASC"
      relation = items.reorder(Arel.sql(@keys.map { |key| "#{key[:sql]} #{direction}" }.join(", ")))
      return relation if after_value.blank?

      # 行の比較 (a, b) > (x, y) は、「a が大きい、または a が同じで b が大きい」と同じ
      columns = @keys.map { |key| key[:sql] }.join(", ")
      placeholders = @keys.map { |key| "CAST(? AS #{key[:cast]})" }.join(", ")
      relation.where("(#{columns}) #{@descending ? '<' : '>'} (#{placeholders})", *cursor_values)
    end

    PARSERS = {
      "timestamptz" => ->(value) { Time.iso8601(value) },
      "bigint" => ->(value) { value.is_a?(Integer) ? value : raise(ArgumentError) }
    }.freeze

    def cursor_values
      values = JSON.parse(decode(after_value))
      raise ArgumentError unless values.is_a?(Array) && values.size == @keys.size

      @keys.zip(values).map { |key, value| PARSERS.fetch(key[:cast]).call(value) }
    rescue JSON::ParserError, ArgumentError, TypeError, GraphQL::ExecutionError
      raise GraphQL::ExecutionError.new("カーソルが正しくありません", extensions: { code: ErrorCode::BAD_REQUEST })
    end

    def reject_backward_arguments
      return if last_value.nil? && before_value.nil?

      raise GraphQL::ExecutionError.new("last と before は使えません。first と after を使ってください", extensions: { code: ErrorCode::BAD_REQUEST })
    end
  end
end
