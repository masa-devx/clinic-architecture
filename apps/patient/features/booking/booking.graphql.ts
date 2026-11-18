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
          startsAt
          endsAt
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

export const BookAppointmentDocument = graphql(`
  mutation BookAppointment($slotId: ID!) {
    bookAppointment(slotId: $slotId) {
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
