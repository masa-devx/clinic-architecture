# typed: false

# マイグレーションの t.datetime・t.timestamps を、タイムゾーン付き（timestamptz）で作る（要件 R8）
ActiveSupport.on_load(:active_record_postgresqladapter) do
  self.datetime_type = :timestamptz
end
