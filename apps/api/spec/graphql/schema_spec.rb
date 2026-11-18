require "rails_helper"

RSpec.describe ClinicSchema do
  it "書き出してある schema.graphql が、今のスキーマと同じ（ずれていたら bin/rails graphql:dump を流す）" do
    expect(Rails.root.join("schema.graphql").read).to eq(described_class.to_definition)
  end

  it "想定していないエラーは、中身を出さずに INTERNAL で返し、ログに残す" do
    allow(Clinic).to receive(:order).and_raise(RuntimeError, "中の事情")
    allow(AppLog).to receive(:error)

    result = execute_graphql("{ clinics { id } }", user: create(:patient), expect_errors: true)

    expect(result["errors"].map { |error| error.dig("extensions", "code") }).to eq([ "INTERNAL" ])
    expect(result.to_json).not_to include("中の事情")
    expect(AppLog).to have_received(:error).with("graphql.Query.clinics", hash_including(err: instance_of(RuntimeError)))
  end

  it "重すぎるクエリは、実行する前に断る" do
    list = "appointments(first: 50) { edges { node { id status canCancel patient { name } slot { startsAt doctor { name } clinic { name doctors { name } } } } } }"
    one = "{ #{list} }"
    many = "{ #{(1..10).map { |n| "a#{n}: #{list}" }.join(' ')} }"

    expect(execute_graphql(one, user: create(:clerk)).dig("data", "appointments", "edges")).to eq([])

    queries = count_queries do
      result = execute_graphql(many, user: create(:clerk), expect_errors: true)
      expect(result["errors"].first["message"]).to match(/complexity/)
      expect(result["data"]).to be_nil
    end
    # スタッフを作る INSERT など、テストの準備の SQL だけ。予約を読む SQL は出ない
    expect(queries).to be <= 4
  end
end
