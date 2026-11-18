import { graphql } from "@/lib/gql";

// 予約の一覧の1行に要る項目。行を描く部品（AppointmentTable）の隣に置き、一覧のクエリはこれを広げて使う
export const AppointmentRow = graphql(`
  fragment AppointmentRow on Appointment {
    id
    status
    canCancel
    canCheckIn
    canStartConsultation
    canFinishConsultation
    bookedByStaff
    canViewQuestionnaire
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
    patient {
      id
      name
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
    appointments(filter: $filter, descending: $descending, first: 20, after: $after) {
      edges {
        node {
          id
          ...AppointmentRow
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
        status
        canCancel
        canceledAt
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
        ...AppointmentRow
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const StartConsultationDocument = graphql(`
  mutation StartConsultation($appointmentId: ID!) {
    startConsultation(appointmentId: $appointmentId) {
      appointment {
        id
        ...AppointmentRow
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const FinishConsultationDocument = graphql(`
  mutation FinishConsultation($appointmentId: ID!) {
    finishConsultation(appointmentId: $appointmentId) {
      appointment {
        id
        ...AppointmentRow
      }
      errors {
        code
        message
        field
      }
    }
  }
`);
