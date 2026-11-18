import { graphql } from "@/lib/gql";

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
