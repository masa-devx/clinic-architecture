require "rails_helper"

RSpec.describe "会計（明細・確定・支払い済・返金）" do
  let(:now) { Time.zone.local(2030, 1, 7, 10) }
  let(:bill) { create(:bill) }
  let(:clinic) { bill.clinic }
  let(:clerk) { create(:clerk, clinic: clinic) }
  let(:first_visit) { create(:fee_item, clinic: clinic, name: "初診料", unit_price: 2_880) }
  let(:prescription) { create(:fee_item, clinic: clinic, name: "処方箋料", unit_price: 680) }

  def update_items(items, actor: clerk)
    Bills::UpdateItems.new(actor: actor, bill_id: bill.id, items: items, now: now).call
  end

  def confirm(actor: clerk) = Bills::Confirm.new(actor: actor, bill_id: bill.id, now: now).call

  def settle(step, actor: clerk) = Bills::Settle.new(actor: actor, bill_id: bill.id, step: step, now: now).call

  def codes(result) = result.errors.map(&:code)

  def item(fee_item, quantity = 1) = { fee_item_id: fee_item.id.to_s, quantity: quantity }

  it "明細を入れて確定すると、合計が決まる。支払い済 → 返金済と進む" do
    expect(update_items([ item(first_visit), item(prescription, 2) ])).to be_success
    expect(confirm).to be_success
    expect(bill.reload).to have_attributes(status: "billed", total_amount: 2_880 + 680 * 2, billed_at: now)

    expect(settle(:pay)).to be_success
    expect(settle(:refund)).to be_success
    expect(bill.reload).to have_attributes(status: "refunded", total_amount: 4_240, paid_at: now, refunded_at: now)
  end

  it "明細を入れ直すと、前の明細は残らない" do
    update_items([ item(first_visit) ])
    update_items([ item(prescription, 3) ])

    expect(bill.items.pluck(:name, :unit_price, :quantity)).to eq([ [ "処方箋料", 680, 3 ] ])
  end

  it "料金の表の値段を変えても、作った明細と、確定した合計は変わらない" do
    update_items([ item(first_visit) ])
    first_visit.update!(unit_price: 9_999, name: "初診料（改定）")

    expect(bill.items.pluck(:name, :unit_price)).to eq([ [ "初診料", 2_880 ] ])
    confirm
    first_visit.update!(unit_price: 1)
    expect(bill.reload.total_amount).to eq(2_880)
  end

  it "確定したあとは、明細を変えられない。2回は確定できない" do
    update_items([ item(first_visit) ])
    confirm

    expect(codes(update_items([ item(prescription) ]))).to eq([ "INVALID_STATE" ])
    expect(codes(confirm)).to eq([ "INVALID_STATE" ])
    expect(bill.items.pluck(:name)).to eq([ "初診料" ])
  end

  it "明細が1行もない会計は、確定できない" do
    expect(confirm.errors.map { |error| [ error.code, error.field ] }).to eq([ [ "INVALID_INPUT", "items" ] ])
    expect(bill.reload.status).to eq("draft")
  end

  it "数量は1〜99。0 と 100 は断り、明細は変わらない" do
    update_items([ item(first_visit, 1) ])

    expect(codes(update_items([ item(first_visit, 0) ]))).to eq([ "INVALID_INPUT" ])
    expect(codes(update_items([ item(first_visit, 100) ]))).to eq([ "INVALID_INPUT" ])
    expect(update_items([ item(first_visit, 99) ])).to be_success
    expect(bill.items.pluck(:quantity)).to eq([ 99 ])
  end

  it "ほかの医療機関の料金の項目は、あっても NOT_FOUND で、明細は変わらない" do
    update_items([ item(first_visit) ])

    expect(codes(update_items([ item(create(:fee_item)) ]))).to eq([ "NOT_FOUND" ])
    expect(bill.items.pluck(:name)).to eq([ "初診料" ])
  end

  it "支払い済にできるのは請求済だけ。返金できるのは支払い済だけ。2回押しても進むのは1回" do
    expect(codes(settle(:pay))).to eq([ "INVALID_STATE" ])
    update_items([ item(first_visit) ])
    confirm
    expect(codes(settle(:refund))).to eq([ "INVALID_STATE" ])

    expect(settle(:pay)).to be_success
    expect(codes(settle(:pay))).to eq([ "INVALID_STATE" ])
    expect(settle(:refund)).to be_success
    expect(codes(settle(:refund))).to eq([ "INVALID_STATE" ])
  end

  it "ほかの医療機関の事務スタッフ・医師・患者には、どの操作も NOT_FOUND" do
    update_items([ item(first_visit) ])
    others = [ create(:clerk), bill.appointment.slot.doctor, bill.appointment.patient ]

    others.each do |other|
      expect(codes(update_items([ item(prescription) ], actor: other))).to eq([ "NOT_FOUND" ])
      expect(codes(confirm(actor: other))).to eq([ "NOT_FOUND" ])
      expect(codes(settle(:pay, actor: other))).to eq([ "NOT_FOUND" ])
    end
    expect(bill.reload.status).to eq("draft")
  end

  describe "見える範囲（BillPolicy.scope）" do
    it "患者に見えるのは、自分の、確定した会計だけ。医師には見えない" do
      patient = bill.appointment.patient
      expect(BillPolicy.scope(patient)).to be_empty

      update_items([ item(first_visit) ])
      confirm
      expect(BillPolicy.scope(patient)).to contain_exactly(bill)
      expect(BillPolicy.scope(create(:patient))).to be_empty
      expect(BillPolicy.scope(bill.appointment.slot.doctor)).to be_empty
      expect(BillPolicy.scope(clerk)).to contain_exactly(bill)
      expect(BillPolicy.scope(create(:clerk))).to be_empty
    end
  end

  describe "DB の制約" do
    it "1つの予約に、会計は2つ入らない" do
      expect { Bill.insert!({ clinic_id: clinic.id, appointment_id: bill.appointment_id, status: "draft" }) }
        .to raise_error(ActiveRecord::RecordNotUnique)
    end

    # 制約に当たるとトランザクションが中断するので、1回ごとにセーブポイントで包んで、続けて確かめられるようにする
    def expect_rejected(constraint, &write)
      expect { ActiveRecord::Base.transaction(requires_new: true, &write) }
        .to raise_error(ActiveRecord::StatementInvalid, /#{constraint}/)
    end

    it "下書きなのに合計がある・確定なのに合計がない会計は入らない。決めていない状態も入らない" do
      target = Bill.where(id: bill.id)

      expect_rejected("bills_total_amount_check") { target.update_all(total_amount: 100) }
      expect_rejected("bills_total_amount_check") { target.update_all(status: "billed") }
      expect_rejected("bills_status_check") { target.update_all(status: "unknown") }
    end

    it "数量が0・100、値段がマイナスの明細は入らない" do
      row = { bill_id: bill.id, name: "x", unit_price: 100, quantity: 1 }

      expect_rejected("bill_items_quantity_check") { BillItem.insert!(row.merge(quantity: 0)) }
      expect_rejected("bill_items_quantity_check") { BillItem.insert!(row.merge(quantity: 100)) }
      expect_rejected("bill_items_unit_price_check") { BillItem.insert!(row.merge(unit_price: -1)) }
      expect { BillItem.insert!(row.merge(quantity: 99, unit_price: 0)) }.to change(BillItem, :count).by(1)
    end
  end
end
