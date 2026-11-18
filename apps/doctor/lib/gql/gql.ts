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
    "\n  fragment ScheduleItemFields on Appointment {\n    id\n    status\n    canStartConsultation\n    canFinishConsultation\n    canViewQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n    }\n  }\n": typeof types.ScheduleItemFieldsFragmentDoc,
    "\n  query Schedule($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 50, after: $after) {\n      edges {\n        node {\n          id\n          # キャンセルした予約を、予定から外すのに使う\n          status\n          ...ScheduleItemFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.ScheduleDocument,
    "\n  mutation StartConsultation($appointmentId: ID!) {\n    startConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.StartConsultationDocument,
    "\n  mutation FinishConsultation($appointmentId: ID!) {\n    finishConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.FinishConsultationDocument,
    "\n  query AppointmentDetail($id: ID!) {\n    appointment(id: $id) {\n      id\n      ...ScheduleItemFields\n      questionnaire {\n        id\n        submitted\n        submittedAt\n        answers {\n          questionId\n          label\n          text\n          selected\n        }\n      }\n    }\n  }\n": typeof types.AppointmentDetailDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n": typeof types.LogoutDocument,
    "\n  query OwnSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.OwnSlotsDocument,
    "\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.CloseSlotDocument,
    "\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": typeof types.CreateSlotsDocument,
    "\n  query Me {\n    me {\n      id\n      kind\n      name\n      staffMemberId\n      clinic {\n        id\n        name\n      }\n    }\n  }\n": typeof types.MeDocument,
};
const documents: Documents = {
    "\n  fragment ScheduleItemFields on Appointment {\n    id\n    status\n    canStartConsultation\n    canFinishConsultation\n    canViewQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n    }\n  }\n": types.ScheduleItemFieldsFragmentDoc,
    "\n  query Schedule($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 50, after: $after) {\n      edges {\n        node {\n          id\n          # キャンセルした予約を、予定から外すのに使う\n          status\n          ...ScheduleItemFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.ScheduleDocument,
    "\n  mutation StartConsultation($appointmentId: ID!) {\n    startConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.StartConsultationDocument,
    "\n  mutation FinishConsultation($appointmentId: ID!) {\n    finishConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.FinishConsultationDocument,
    "\n  query AppointmentDetail($id: ID!) {\n    appointment(id: $id) {\n      id\n      ...ScheduleItemFields\n      questionnaire {\n        id\n        submitted\n        submittedAt\n        answers {\n          questionId\n          label\n          text\n          selected\n        }\n      }\n    }\n  }\n": types.AppointmentDetailDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      viewer {\n        id\n        kind\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      errors {\n        code\n        message\n      }\n    }\n  }\n": types.LogoutDocument,
    "\n  query OwnSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.OwnSlotsDocument,
    "\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.CloseSlotDocument,
    "\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n": types.CreateSlotsDocument,
    "\n  query Me {\n    me {\n      id\n      kind\n      name\n      staffMemberId\n      clinic {\n        id\n        name\n      }\n    }\n  }\n": types.MeDocument,
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
export function graphql(source: "\n  fragment ScheduleItemFields on Appointment {\n    id\n    status\n    canStartConsultation\n    canFinishConsultation\n    canViewQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n    }\n  }\n"): (typeof documents)["\n  fragment ScheduleItemFields on Appointment {\n    id\n    status\n    canStartConsultation\n    canFinishConsultation\n    canViewQuestionnaire\n    questionnaire {\n      id\n      submitted\n    }\n    patient {\n      id\n      name\n    }\n    slot {\n      id\n      startsAt\n      endsAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Schedule($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 50, after: $after) {\n      edges {\n        node {\n          id\n          # キャンセルした予約を、予定から外すのに使う\n          status\n          ...ScheduleItemFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query Schedule($filter: AppointmentFilter, $after: String) {\n    appointments(filter: $filter, first: 50, after: $after) {\n      edges {\n        node {\n          id\n          # キャンセルした予約を、予定から外すのに使う\n          status\n          ...ScheduleItemFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartConsultation($appointmentId: ID!) {\n    startConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation StartConsultation($appointmentId: ID!) {\n    startConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation FinishConsultation($appointmentId: ID!) {\n    finishConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation FinishConsultation($appointmentId: ID!) {\n    finishConsultation(appointmentId: $appointmentId) {\n      appointment {\n        id\n        ...ScheduleItemFields\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AppointmentDetail($id: ID!) {\n    appointment(id: $id) {\n      id\n      ...ScheduleItemFields\n      questionnaire {\n        id\n        submitted\n        submittedAt\n        answers {\n          questionId\n          label\n          text\n          selected\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AppointmentDetail($id: ID!) {\n    appointment(id: $id) {\n      id\n      ...ScheduleItemFields\n      questionnaire {\n        id\n        submitted\n        submittedAt\n        answers {\n          questionId\n          label\n          text\n          selected\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query OwnSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query OwnSlots($doctorId: ID, $after: String) {\n    availableSlots(doctorId: $doctorId, first: 30, after: $after) {\n      edges {\n        node {\n          id\n          startsAt\n          endsAt\n          canClose\n          doctor {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CloseSlot($slotId: ID!) {\n    closeSlot(slotId: $slotId) {\n      slot {\n        id\n        closedAt\n        canClose\n      }\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSlots($input: CreateSlotsInput!) {\n    createSlots(input: $input) {\n      createdCount\n      skippedCount\n      errors {\n        code\n        message\n        field\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      kind\n      name\n      staffMemberId\n      clinic {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      kind\n      name\n      staffMemberId\n      clinic {\n        id\n        name\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;