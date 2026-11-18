import { graphql } from "@/lib/gql";

// 問診の画面に要る項目（質問・保存してある答え・誰の、いつの予約か）
export const QuestionnaireDetail = graphql(`
  fragment QuestionnaireDetail on Appointment {
    id
    canViewQuestionnaire
    canAnswerQuestionnaire
    questionnaireQuestions {
      id
      label
      kind
      options
      required
    }
    questionnaire {
      id
      submitted
      submittedAt
      answers {
        questionId
        label
        kind
        text
        selected
      }
    }
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
`);

export const QuestionnaireDocument = graphql(`
  query Questionnaire($appointmentId: ID!) {
    appointment(id: $appointmentId) {
      id
      ...QuestionnaireDetail
    }
  }
`);

export const SaveQuestionnaireDocument = graphql(`
  mutation SaveQuestionnaire($appointmentId: ID!, $answers: [QuestionnaireAnswerInput!]!, $submit: Boolean!) {
    saveQuestionnaire(appointmentId: $appointmentId, answers: $answers, submit: $submit) {
      appointment {
        id
        ...QuestionnaireDetail
      }
      errors {
        code
        message
        field
      }
    }
  }
`);
