import { graphql } from "@/lib/gql";

// 診察の予定の1件に要る項目。どの操作のあとも、同じ形で受け取って、画面を新しくする
export const ScheduleItemFields = graphql(`
  fragment ScheduleItemFields on Appointment {
    id
    status
    canStartConsultation
    canFinishConsultation
    canViewQuestionnaire
    questionnaire {
      id
      submitted
    }
    patient {
      id
      name
    }
    slot {
      id
      startsAt
      endsAt
    }
  }
`);

// 医師に見えるのは、自分が担当の予約だけ（絞るのはサーバー）
export const ScheduleDocument = graphql(`
  query Schedule($filter: AppointmentFilter, $after: String) {
    appointments(filter: $filter, first: 50, after: $after) {
      edges {
        node {
          id
          # キャンセルした予約を、予定から外すのに使う
          status
          ...ScheduleItemFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export const StartConsultationDocument = graphql(`
  mutation StartConsultation($appointmentId: ID!) {
    startConsultation(appointmentId: $appointmentId) {
      appointment {
        id
        ...ScheduleItemFields
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
        ...ScheduleItemFields
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

// 1件の予約と、問診の答え（答えを読むと、監査ログに「問診を見た」が残る）
export const AppointmentDetailDocument = graphql(`
  query AppointmentDetail($id: ID!) {
    appointment(id: $id) {
      id
      ...ScheduleItemFields
      questionnaire {
        id
        submitted
        submittedAt
        answers {
          questionId
          label
          text
          selected
        }
      }
    }
  }
`);
