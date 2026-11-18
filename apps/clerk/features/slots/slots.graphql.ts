import { graphql } from "@/lib/gql";

export const AvailableSlotsDocument = graphql(`
  query AvailableSlots($doctorId: ID, $after: String) {
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

export const BookAppointmentDocument = graphql(`
  mutation BookAppointment($slotId: ID!, $patientEmail: String!) {
    bookAppointment(slotId: $slotId, patientEmail: $patientEmail) {
      appointment {
        id
        status
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const RescheduleAppointmentDocument = graphql(`
  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {
    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {
      appointment {
        id
        status
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
