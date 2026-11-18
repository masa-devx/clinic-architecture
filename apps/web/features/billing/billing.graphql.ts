import { graphql } from "@/lib/gql";

// 会計の画面に要る項目。どの操作のあとも、同じ形で受け取って、画面を新しくする
export const BillDetail = graphql(`
  fragment BillDetail on Bill {
    id
    status
    totalAmount
    canManage
    billedAt
    paidAt
    refundedAt
    items {
      id
      name
      unitPrice
      quantity
      amount
    }
    appointment {
      id
      patient {
        id
        name
      }
      slot {
        id
        startsAt
        doctor {
          id
          name
        }
        clinic {
          id
          name
        }
      }
    }
  }
`);

// 会計と、（事務スタッフなら）料金の表を、1回の通信で取る
export const BillDocument = graphql(`
  query Bill($id: ID!) {
    bill(id: $id) {
      id
      ...BillDetail
    }
    feeItems {
      id
      name
      unitPrice
    }
  }
`);

export const UpdateBillItemsDocument = graphql(`
  mutation UpdateBillItems($billId: ID!, $items: [BillItemInput!]!) {
    updateBillItems(billId: $billId, items: $items) {
      bill {
        id
        ...BillDetail
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const ConfirmBillDocument = graphql(`
  mutation ConfirmBill($billId: ID!) {
    confirmBill(billId: $billId) {
      bill {
        id
        ...BillDetail
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const MarkBillPaidDocument = graphql(`
  mutation MarkBillPaid($billId: ID!) {
    markBillPaid(billId: $billId) {
      bill {
        id
        ...BillDetail
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const RefundBillDocument = graphql(`
  mutation RefundBill($billId: ID!) {
    refundBill(billId: $billId) {
      bill {
        id
        ...BillDetail
      }
      errors {
        code
        message
        field
      }
    }
  }
`);
