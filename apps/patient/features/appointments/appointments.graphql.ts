import { graphql } from "@/lib/gql";

// 予約のカード1枚に要る項目。カードを描く部品（AppointmentCard）の隣に置き、一覧のクエリはこれを広げて使う
export const AppointmentCardFields = graphql(`
  fragment AppointmentCardFields on Appointment {
    id
    status
    canCancel
    canCheckIn
    canAnswerQuestionnaire
    questionnaire {
      id
      submitted
    }
    bill {
      id
      status
      totalAmount
    }
    slot {
      id
      startsAt
      endsAt
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
`);

export const AppointmentsDocument = graphql(`
  query Appointments($filter: AppointmentFilter, $descending: Boolean, $after: String) {
    appointments(filter: $filter, descending: $descending, first: 10, after: $after) {
      edges {
        node {
          id
          ...AppointmentCardFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export const CancelAppointmentDocument = graphql(`
  mutation CancelAppointment($appointmentId: ID!) {
    cancelAppointment(appointmentId: $appointmentId) {
      appointment {
        id
        ...AppointmentCardFields
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const CheckInDocument = graphql(`
  mutation CheckIn($appointmentId: ID!) {
    checkIn(appointmentId: $appointmentId) {
      appointment {
        id
        ...AppointmentCardFields
      }
      errors {
        code
        message
        field
      }
    }
  }
`);
