import { graphql } from "@/lib/gql";

export const BillDocument = graphql(`
  query Bill($id: ID!) {
    bill(id: $id) {
      id
      status
      totalAmount
      billedAt
      paidAt
      items {
        id
        name
        unitPrice
        quantity
        amount
      }
      appointment {
        id
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
  }
`);
