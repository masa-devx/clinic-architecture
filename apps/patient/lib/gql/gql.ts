/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment AppointmentCardFields on Appointment {\n    id\n    status\n    canCancel\n    canCheckIn\n    canAnswerQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n": typeof types.AppointmentCardFieldsFragmentDoc,
    "\n  query Appointments($filter: AppointmentFilter, $descending: Boolean, $after: String) {\n    appointments(filter: $filter, descending: $descending, first: 10, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentCardFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.AppointmentsDocument,
    "\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.CancelAppointmentDocument,
    "\n  mutation CheckIn($appointmentId: ID!) {\n    checkIn(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.CheckInDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n": typeof types.LogoutDocument,
    "\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      status\n      totalAmount\n      billedAt\n      paidAt\n      items {\n        id\n        name\n        unitPrice\n        quantity\n        amount\n      }\n      appointment {\n        id\n        slot {\n          id\n          startsAt\n          doctor {\n            id\n            name\n          }\n          clinic {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n": typeof types.BillDocument,
    "\n  query Clinics {\n    clinics {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n  }\n": typeof types.ClinicsDocument,
    "\n  query AvailableSlots($clinicId: ID!, $doctorId: ID, $after: String) {\n    clinic(id: $clinicId) {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n    availableSlots(clinicId: $clinicId, doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.AvailableSlotsDocument,
    "\n  mutation BookAppointment($slotId: ID!) {\n    bookAppointment(slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.BookAppointmentDocument,
    "\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.RescheduleAppointmentDocument,
    "\n  fragment QuestionnaireDetail on Appointment {\n    id\n    canViewQuestionnaire\n    canAnswerQuestionnaire\n    questionnaireQuestions {\n      id\n      label\n      kind\n      options\n      required\n    }\n    questionnaire {\n      id\n      submitted\n      submittedAt\n      answers {\n        questionId\n        label\n        kind\n        text\n        selected\n      }\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n": typeof types.QuestionnaireDetailFragmentDoc,
    "\n  query Questionnaire($appointmentId: ID!) {\n    appointment(id: $appointmentId) {\n      id\n      ...QuestionnaireDetail\n    }\n  }\n": typeof types.QuestionnaireDocument,
    "\n  mutation SaveQuestionnaire($appointmentId: ID!, $answers: [QuestionnaireAnswerInput!]!, $submit: Boolean!) {\n    saveQuestionnaire(appointmentId: $appointmentId, answers: $answers, submit: $submit) {\n      appointment {\n        id\n        ...QuestionnaireDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.SaveQuestionnaireDocument,
    "\n  query Me {\n    me {\n      id\n      kind\n      name\n    }\n  }\n": typeof types.MeDocument,
};
const documents: Documents = {
    "\n  fragment AppointmentCardFields on Appointment {\n    id\n    status\n    canCancel\n    canCheckIn\n    canAnswerQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n": types.AppointmentCardFieldsFragmentDoc,
    "\n  query Appointments($filter: AppointmentFilter, $descending: Boolean, $after: String) {\n    appointments(filter: $filter, descending: $descending, first: 10, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentCardFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.AppointmentsDocument,
    "\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.CancelAppointmentDocument,
    "\n  mutation CheckIn($appointmentId: ID!) {\n    checkIn(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.CheckInDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n": types.LogoutDocument,
    "\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      status\n      totalAmount\n      billedAt\n      paidAt\n      items {\n        id\n        name\n        unitPrice\n        quantity\n        amount\n      }\n      appointment {\n        id\n        slot {\n          id\n          startsAt\n          doctor {\n            id\n            name\n          }\n          clinic {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n": types.BillDocument,
    "\n  query Clinics {\n    clinics {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n  }\n": types.ClinicsDocument,
    "\n  query AvailableSlots($clinicId: ID!, $doctorId: ID, $after: String) {\n    clinic(id: $clinicId) {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n    availableSlots(clinicId: $clinicId, doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.AvailableSlotsDocument,
    "\n  mutation BookAppointment($slotId: ID!) {\n    bookAppointment(slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.BookAppointmentDocument,
    "\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.RescheduleAppointmentDocument,
    "\n  fragment QuestionnaireDetail on Appointment {\n    id\n    canViewQuestionnaire\n    canAnswerQuestionnaire\n    questionnaireQuestions {\n      id\n      label\n      kind\n      options\n      required\n    }\n    questionnaire {\n      id\n      submitted\n      submittedAt\n      answers {\n        questionId\n        label\n        kind\n        text\n        selected\n      }\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n": types.QuestionnaireDetailFragmentDoc,
    "\n  query Questionnaire($appointmentId: ID!) {\n    appointment(id: $appointmentId) {\n      id\n      ...QuestionnaireDetail\n    }\n  }\n": types.QuestionnaireDocument,
    "\n  mutation SaveQuestionnaire($appointmentId: ID!, $answers: [QuestionnaireAnswerInput!]!, $submit: Boolean!) {\n    saveQuestionnaire(appointmentId: $appointmentId, answers: $answers, submit: $submit) {\n      appointment {\n        id\n        ...QuestionnaireDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.SaveQuestionnaireDocument,
    "\n  query Me {\n    me {\n      id\n      kind\n      name\n    }\n  }\n": types.MeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AppointmentCardFields on Appointment {\n    id\n    status\n    canCancel\n    canCheckIn\n    canAnswerQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment AppointmentCardFields on Appointment {\n    id\n    status\n    canCancel\n    canCheckIn\n    canAnswerQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    bill {\n      id\n      status\n      totalAmount\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Appointments($filter: AppointmentFilter, $descending: Boolean, $after: String) {\n    appointments(filter: $filter, descending: $descending, first: 10, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentCardFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query Appointments($filter: AppointmentFilter, $descending: Boolean, $after: String) {\n    appointments(filter: $filter, descending: $descending, first: 10, after: $after) {\n      edges {\n        node {\n          id\n          ...AppointmentCardFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CancelAppointment($appointmentId: ID!) {\n    cancelAppointment(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CheckIn($appointmentId: ID!) {\n    checkIn(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CheckIn($appointmentId: ID!) {\n    checkIn(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...AppointmentCardFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      status\n      totalAmount\n      billedAt\n      paidAt\n      items {\n        id\n        name\n        unitPrice\n        quantity\n        amount\n      }\n      appointment {\n        id\n        slot {\n          id\n          startsAt\n          doctor {\n            id\n            name\n          }\n          clinic {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Bill($id: ID!) {\n    bill(id: $id) {\n      id\n      status\n      totalAmount\n      billedAt\n      paidAt\n      items {\n        id\n        name\n        unitPrice\n        quantity\n        amount\n      }\n      appointment {\n        id\n        slot {\n          id\n          startsAt\n          doctor {\n            id\n            name\n          }\n          clinic {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Clinics {\n    clinics {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query Clinics {\n    clinics {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AvailableSlots($clinicId: ID!, $doctorId: ID, $after: String) {\n    clinic(id: $clinicId) {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n    availableSlots(clinicId: $clinicId, doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query AvailableSlots($clinicId: ID!, $doctorId: ID, $after: String) {\n    clinic(id: $clinicId) {\n      id\n      name\n      doctors {\n        id\n        name\n      }\n    }\n    availableSlots(clinicId: $clinicId, doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BookAppointment($slotId: ID!) {\n    bookAppointment(slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation BookAppointment($slotId: ID!) {\n    bookAppointment(slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RescheduleAppointment($appointmentId: ID!, $slotId: ID!) {\n    rescheduleAppointment(appointmentId: $appointmentId, slotId: $slotId) {\n      appointment {\n        id\n        status\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment QuestionnaireDetail on Appointment {\n    id\n    canViewQuestionnaire\n    canAnswerQuestionnaire\n    questionnaireQuestions {\n      id\n      label\n      kind\n      options\n      required\n    }\n    questionnaire {\n      id\n      submitted\n      submittedAt\n      answers {\n        questionId\n        label\n        kind\n        text\n        selected\n      }\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment QuestionnaireDetail on Appointment {\n    id\n    canViewQuestionnaire\n    canAnswerQuestionnaire\n    questionnaireQuestions {\n      id\n      label\n      kind\n      options\n      required\n    }\n    questionnaire {\n      id\n      submitted\n      submittedAt\n      answers {\n        questionId\n        label\n        kind\n        text\n        selected\n      }\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      doctor {\n        id\n        name\n      }\n      clinic {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Questionnaire($appointmentId: ID!) {\n    appointment(id: $appointmentId) {\n      id\n      ...QuestionnaireDetail\n    }\n  }\n"): (typeof documents)["\n  query Questionnaire($appointmentId: ID!) {\n    appointment(id: $appointmentId) {\n      id\n      ...QuestionnaireDetail\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveQuestionnaire($appointmentId: ID!, $answers: [QuestionnaireAnswerInput!]!, $submit: Boolean!) {\n    saveQuestionnaire(appointmentId: $appointmentId, answers: $answers, submit: $submit) {\n      appointment {\n        id\n        ...QuestionnaireDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SaveQuestionnaire($appointmentId: ID!, $answers: [QuestionnaireAnswerInput!]!, $submit: Boolean!) {\n    saveQuestionnaire(appointmentId: $appointmentId, answers: $answers, submit: $submit) {\n      appointment {\n        id\n        ...QuestionnaireDetail\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      kind\n      name\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      kind\n      name\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;