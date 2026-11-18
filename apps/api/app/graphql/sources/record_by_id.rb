# id から1件を読む読み込みを、同じ表ごとにためて、1回の SQL（WHERE id IN (...)）にまとめる
# 使うのは、すでに認可を通った親（予約 → 枠・患者、枠 → 医師）から、外部キーをたどるときだけ。
# 画面から受け取った id を、ここに直接渡さない（医療機関の条件が付かないため）
module Sources
  class RecordById < GraphQL::Dataloader::Source
    def initialize(model)
      @model = model
    end

    def fetch(ids)
      records = @model.where(id: ids).index_by(&:id)
      ids.map { |id| records[id] }
    end
  end
end
