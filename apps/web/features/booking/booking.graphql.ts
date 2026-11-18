import { graphql } from "@/lib/gql";

export const ClinicsDocument = graphql(`
  query Clinics {
    clinics {
      id
      name
      doctors {
        id
        name
      }
    }
  }
`);

// 枠の一覧の1行に要る項目。行を描く部品（SlotList）の隣に置く
export const SlotRow = graphql(`
  fragment SlotRow on Slot {
    id
    startsAt
    endsAt
    canClose
    doctor {
      id
      name
    }
  }
`);

// 医療機関（名前と医師）と、空いている枠を、1回の通信で取る
export const AvailableSlotsDocument = graphql(`
  query AvailableSlots($clinicId: ID!, $doctorId: ID, $after: String) {
    clinic(id: $clinicId) {
      id
      name
      doctors {
        id
        name
      }
    }
    availableSlots(clinicId: $clinicId, doctorId: $doctorId, first: 30, after: $after) {
      edges {
        node {
          id
          ...SlotRow
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export const BookAppointmentDocument = graphql(`
  mutation BookAppointment($slotId: ID!, $patientEmail: String) {
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
        canCancel
        slot {
          id
          startsAt
          endsAt
          doctor {
            id
            name
          }
        }
      }
      errors {
        code
        message
        field
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
