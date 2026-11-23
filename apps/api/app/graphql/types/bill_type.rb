# typed: false

module Types
  class BillType < Types::BaseObject
    graphql_name "Bill"
    description "会計"

    field :id, ID, null: false
    field :status, Types::BillStatusEnum, null: false
    field :total_amount, Integer, description: "合計（円）。確定のときに決まる。作成中は null"
    field :items, [ Types::BillItemType ], null: false
    field :appointment, Types::AppointmentType, null: false
    field :billed_at, GraphQL::Types::ISO8601DateTime
    field :paid_at, GraphQL::Types::ISO8601DateTime
    field :refunded_at, GraphQL::Types::ISO8601DateTime
    field :can_manage, Boolean, null: false, description: "今、ログインしている人が、明細の変更・確定・支払い済・返金をできるか"

    def self.authorized?(bill, context)
      appointment = context.dataloader.with(Sources::RecordById, ::Appointment).load(bill.appointment_id)
      super && BillPolicy.new(context[:current_user], bill, patient_id: appointment.patient_id).show?
    end

    # 明細を読んだ、を残す（状態と合計だけを見たときは、残さない）。
    # 入口（bill(id:)）ではなく、ここに置く。予約からたどって読んだときにも、残るようにするため
    def items
      appointment = dataloader.with(Sources::RecordById, ::Appointment).load(object.appointment_id)
      audit_view("bill.view", clinic_id: object.clinic_id, patient_id: appointment.patient_id, subject: object)
      dataloader.with(Sources::ItemsByBill).load(object.id)
    end

    def appointment = record(::Appointment, object.appointment_id)

    def can_manage = BillPolicy.new(context[:current_user], object).manage?
  end
end
