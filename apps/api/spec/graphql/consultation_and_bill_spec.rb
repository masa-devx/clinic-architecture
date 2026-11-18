require "rails_helper"

RSpec.describe "受付〜会計（GraphQL を通す）" do
  let(:starts_at) { Time.zone.local(2030, 1, 7, 9) }
  let(:slot) { create(:slot, starts_at: starts_at) }
  let(:doctor) { slot.doctor }
  let(:clerk) { create(:clerk, clinic: slot.clinic) }
  let(:patient) { create(:patient) }
  let!(:appointment) { create(:appointment, slot: slot, patient: patient) }
  let!(:fee_item) { create(:fee_item, clinic: slot.clinic, name: "再診料", unit_price: 730) }

  let(:list) do
    "{ appointments { edges { node { id status canCheckIn canStartConsultation canFinishConsultation canCancel bill { id status totalAmount items { name unitPrice quantity amount } canManage } } } } }"
  end

  def run(query, user:, at:, **variables)
    execute_graphql(query, variables: variables, user: user, now: at)["data"]
  end

  def node(user:, at:) = run(list, user: user, at: at).dig("appointments", "edges", 0, "node")

  def mutate(name, user:, at:, argument: "appointmentId", id: appointment.id, extra: "", fields: "errors { code }")
    query = "mutation($id: ID!) { #{name}(#{argument}: $id#{extra}) { #{fields} } }"
    run(query, user: user, at: at, id: id.to_s)[name]
  end

  it "患者が受付し、医師が診察して、事務スタッフが会計を確定し、患者が会計を見る" do
    early = starts_at - 10.minutes
    expect(node(user: patient, at: early)).to include("canCheckIn" => true, "bill" => nil)
    expect(node(user: doctor, at: early)).to include("canCheckIn" => false, "canStartConsultation" => false)
    expect(mutate("checkIn", user: patient, at: early)["errors"]).to eq([])

    expect(node(user: doctor, at: starts_at)).to include("status" => "CHECKED_IN", "canStartConsultation" => true, "canFinishConsultation" => false)
    expect(node(user: clerk, at: starts_at)).to include("canStartConsultation" => false, "canCancel" => true)
    expect(mutate("startConsultation", user: doctor, at: starts_at)["errors"]).to eq([])
    expect(node(user: doctor, at: starts_at)).to include("canStartConsultation" => false, "canFinishConsultation" => true)
    expect(mutate("finishConsultation", user: doctor, at: starts_at + 20.minutes)["errors"]).to eq([])

    after = starts_at + 30.minutes
    bill_id = node(user: clerk, at: after).dig("bill", "id")
    expect(node(user: clerk, at: after)["bill"]).to include("status" => "DRAFT", "totalAmount" => nil, "items" => [], "canManage" => true)
    # 下書きのあいだは、患者には見せない。医師には、ずっと見せない
    expect(node(user: patient, at: after)["bill"]).to be_nil
    expect(node(user: doctor, at: after)["bill"]).to be_nil

    items = %(, items: [{ feeItemId: "#{fee_item.id}", quantity: 2 }])
    expect(mutate("updateBillItems", user: clerk, at: after, argument: "billId", id: bill_id, extra: items)["errors"]).to eq([])
    expect(mutate("confirmBill", user: clerk, at: after, argument: "billId", id: bill_id)["errors"]).to eq([])

    expect(node(user: patient, at: after)["bill"]).to eq(
      "id" => bill_id, "status" => "BILLED", "totalAmount" => 1_460, "canManage" => false,
      "items" => [ { "name" => "再診料", "unitPrice" => 730, "quantity" => 2, "amount" => 1_460 } ]
    )
    expect(mutate("markBillPaid", user: clerk, at: after, argument: "billId", id: bill_id, fields: "bill { status } errors { code }"))
      .to eq("bill" => { "status" => "PAID" }, "errors" => [])
  end

  it "bill(id:) は、見られない人には null（ほかの患者・ほかの医療機関の事務スタッフ・下書きのあいだの本人）" do
    bill = create(:bill, appointment: appointment, clinic: appointment.clinic)
    query = "query($id: ID!) { bill(id: $id) { id } }"
    fetch = ->(user) { run(query, user: user, at: starts_at, id: bill.id.to_s)["bill"] }

    expect(fetch.call(clerk)).to eq("id" => bill.id.to_s)
    [ patient, create(:patient), create(:clerk) ].each { |user| expect(fetch.call(user)).to be_nil }
    # 医師の入口には bill の操作がない。予約からたどっても、医師には null
    expect(node(user: doctor, at: starts_at)["bill"]).to be_nil

    bill.update!(status: :billed, total_amount: 0, billed_at: starts_at)
    expect(fetch.call(patient)).to eq("id" => bill.id.to_s)
    expect(fetch.call(create(:patient))).to be_nil
  end

  # 医師と患者の入口には、料金の表の操作そのものが載っていない（spec/graphql/schema_spec.rb）
  it "料金の表は、自院の分だけが出る" do
    create(:fee_item)
    query = "{ feeItems { name unitPrice } }"

    expect(run(query, user: clerk, at: starts_at)["feeItems"]).to eq([ { "name" => "再診料", "unitPrice" => 730 } ])
    expect(run(query, user: create(:clerk), at: starts_at)["feeItems"]).to eq([])
  end

  it "一覧に会計と明細を足しても、行が増えて SQL の本数は変わらない" do
    make = lambda do |i|
      each = create(:appointment, slot: create(:slot, doctor: doctor, starts_at: starts_at + (i + 1).hours), status: :completed)
      create(:bill_item, bill: create(:bill, appointment: each, clinic: each.clinic))
    end
    2.times(&make)
    run(list, user: clerk, at: starts_at)
    few = count_queries { run(list, user: clerk, at: starts_at) }
    6.times { |i| make.call(i + 2) }
    many = count_queries { expect(run(list, user: clerk, at: starts_at).dig("appointments", "edges").size).to eq(9) }

    expect(many).to eq(few)
  end
end
