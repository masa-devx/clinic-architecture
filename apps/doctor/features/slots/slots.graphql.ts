import { graphql } from "@/lib/gql";

// 自分の空いている枠
export const OwnSlotsDocument = graphql(`
  query OwnSlots($doctorId: ID, $after: String) {
    availableSlots(doctorId: $doctorId, first: 30, after: $after) {
      edges {
        node {
          id
          startsAt
          endsAt
          canClose
          doctor {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export const CloseSlotDocument = graphql(`
  mutation CloseSlot($slotId: ID!) {
    closeSlot(slotId: $slotId) {
      slot {
        id
        closedAt
        canClose
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const CreateSlotsDocument = graphql(`
  mutation CreateSlots($input: CreateSlotsInput!) {
    createSlots(input: $input) {
      createdCount
      skippedCount
      errors {
        code
        message
        field
      }
    }
  }
`);
