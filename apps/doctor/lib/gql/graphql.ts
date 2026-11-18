/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** 予約の一覧の絞り込み。日付は日本時間で、from・to の日を含む */
export type AppointmentFilter = {
  doctorId?: string | number | null | undefined;
  from?: string | null | undefined;
  status?: AppointmentStatus | null | undefined;
  to?: string | null | undefined;
};

export type AppointmentStatus =
  /** 予約済 */
  | 'BOOKED'
  /** キャンセル */
  | 'CANCELED'
  /** 受付済 */
  | 'CHECKED_IN'
  /** 診察済 */
  | 'COMPLETED'
  /** 診察中 */
  | 'IN_CONSULTATION'
  /** 無断キャンセル */
  | 'NO_SHOW';

/** 診療枠をまとめて作る入力。日付と時刻は日本時間 */
export type CreateSlotsInput = {
  doctorId: string | number;
  /** 時間帯の終わり。HH:MM */
  endTime: string;
  /** 期間の最初の日 */
  from: string;
  /** 1枠の長さ（分） */
  slotMinutes: number;
  /** 時間帯の始まり。HH:MM */
  startTime: string;
  /** 期間の最後の日（この日を含む） */
  to: string;
  /** 曜日。0（日）〜 6（土） */
  weekdays: Array<number>;
};

/** 使う人が直せるエラーの種類 */
export type ErrorCode =
  /** キャンセル・変更できる期限を過ぎている */
  | 'CANCEL_DEADLINE_PASSED'
  /** ほかの操作とぶつかった。もう一度試せば通ることがある */
  | 'CONFLICT'
  /** メールアドレスかパスワードが違う */
  | 'INVALID_CREDENTIALS'
  /** 入力に誤りがある */
  | 'INVALID_INPUT'
  /** 今の状態では、その操作はできない */
  | 'INVALID_STATE'
  /** 対象が見つからない（ほかの医療機関・ほかの人のものも、見つからないとして返す） */
  | 'NOT_FOUND'
  /** 見えているが、その操作はできない */
  | 'NOT_PERMITTED'
  /** 受付できる時間の外 */
  | 'OUTSIDE_TIME_WINDOW'
  /** 枠がすでに埋まっている */
  | 'SLOT_TAKEN'
  /** 枠の時刻を過ぎたか、閉じられていて、予約できない */
  | 'SLOT_UNAVAILABLE';

export type ViewerKind =
  /** 事務スタッフ */
  | 'CLERK'
  /** 医師 */
  | 'DOCTOR'
  /** 患者 */
  | 'PATIENT';

export type ScheduleItemFieldsFragment = { id: string, status: AppointmentStatus, canStartConsultation: boolean, canFinishConsultation: boolean, canViewQuestionnaire: boolean, questionnaire: { id: string, submitted: boolean } | null, patient: { id: string, name: string }, slot: { id: string, startsAt: string, endsAt: string } } & { ' $fragmentName'?: 'ScheduleItemFieldsFragment' };

export type ScheduleQueryVariables = Exact<{
  filter?: AppointmentFilter | null | undefined;
  after?: string | null | undefined;
}>;


export type ScheduleQuery = { appointments: { edges: Array<{ node: (
        { id: string, status: AppointmentStatus }
        & { ' $fragmentRefs'?: { 'ScheduleItemFieldsFragment': ScheduleItemFieldsFragment } }
      ) | null } | null> | null, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type StartConsultationMutationVariables = Exact<{
  appointmentId: string | number;
}>;


export type StartConsultationMutation = { startConsultation: { appointment: (
      { id: string }
      & { ' $fragmentRefs'?: { 'ScheduleItemFieldsFragment': ScheduleItemFieldsFragment } }
    ) | null, errors: Array<{ code: ErrorCode, message: string, field: string | null }> } };

export type FinishConsultationMutationVariables = Exact<{
  appointmentId: string | number;
}>;


export type FinishConsultationMutation = { finishConsultation: { appointment: (
      { id: string }
      & { ' $fragmentRefs'?: { 'ScheduleItemFieldsFragment': ScheduleItemFieldsFragment } }
    ) | null, errors: Array<{ code: ErrorCode, message: string, field: string | null }> } };

export type AppointmentDetailQueryVariables = Exact<{
  id: string | number;
}>;


export type AppointmentDetailQuery = { appointment: (
    { id: string, questionnaire: { id: string, submitted: boolean, submittedAt: string | null, answers: Array<{ questionId: string, label: string, text: string | null, selected: Array<string> | null }> } | null }
    & { ' $fragmentRefs'?: { 'ScheduleItemFieldsFragment': ScheduleItemFieldsFragment } }
  ) | null };

export type LoginMutationVariables = Exact<{
  email: string;
  password: string;
}>;


export type LoginMutation = { login: { viewer: { id: string, kind: ViewerKind } | null, errors: Array<{ code: ErrorCode, message: string, field: string | null }> } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: { errors: Array<{ code: ErrorCode, message: string }> } };

export type OwnSlotsQueryVariables = Exact<{
  doctorId?: string | number | null | undefined;
  after?: string | null | undefined;
}>;


export type OwnSlotsQuery = { availableSlots: { edges: Array<{ node: { id: string, startsAt: string, endsAt: string, canClose: boolean, doctor: { id: string, name: string } } | null } | null> | null, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type CloseSlotMutationVariables = Exact<{
  slotId: string | number;
}>;


export type CloseSlotMutation = { closeSlot: { slot: { id: string, closedAt: string | null, canClose: boolean } | null, errors: Array<{ code: ErrorCode, message: string, field: string | null }> } };

export type CreateSlotsMutationVariables = Exact<{
  input: CreateSlotsInput;
}>;


export type CreateSlotsMutation = { createSlots: { createdCount: number | null, skippedCount: number | null, errors: Array<{ code: ErrorCode, message: string, field: string | null }> } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, kind: ViewerKind, name: string, staffMemberId: string | null, clinic: { id: string, name: string } | null } | null };

export const ScheduleItemFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduleItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Appointment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"canStartConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canFinishConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canViewQuestionnaire"}},{"kind":"Field","name":{"kind":"Name","value":"questionnaire"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"slot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}}]}}]}}]} as unknown as DocumentNode<ScheduleItemFieldsFragment, unknown>;
export const ScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Schedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AppointmentFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appointments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"50"}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScheduleItemFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduleItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Appointment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"canStartConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canFinishConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canViewQuestionnaire"}},{"kind":"Field","name":{"kind":"Name","value":"questionnaire"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"slot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}}]}}]}}]} as unknown as DocumentNode<ScheduleQuery, ScheduleQueryVariables>;
export const StartConsultationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StartConsultation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appointmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startConsultation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"appointmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appointmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appointment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScheduleItemFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"field"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduleItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Appointment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"canStartConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canFinishConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canViewQuestionnaire"}},{"kind":"Field","name":{"kind":"Name","value":"questionnaire"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"slot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}}]}}]}}]} as unknown as DocumentNode<StartConsultationMutation, StartConsultationMutationVariables>;
export const FinishConsultationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinishConsultation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"appointmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finishConsultation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"appointmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"appointmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appointment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScheduleItemFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"field"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduleItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Appointment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"canStartConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canFinishConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canViewQuestionnaire"}},{"kind":"Field","name":{"kind":"Name","value":"questionnaire"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"slot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}}]}}]}}]} as unknown as DocumentNode<FinishConsultationMutation, FinishConsultationMutationVariables>;
export const AppointmentDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AppointmentDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScheduleItemFields"}},{"kind":"Field","name":{"kind":"Name","value":"questionnaire"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitted"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"answers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"questionId"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"selected"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScheduleItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Appointment"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"canStartConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canFinishConsultation"}},{"kind":"Field","name":{"kind":"Name","value":"canViewQuestionnaire"}},{"kind":"Field","name":{"kind":"Name","value":"questionnaire"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submitted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"patient"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"slot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}}]}}]}}]} as unknown as DocumentNode<AppointmentDetailQuery, AppointmentDetailQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"field"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const OwnSlotsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OwnSlots"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"doctorId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableSlots"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"doctorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"doctorId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"30"}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}},{"kind":"Field","name":{"kind":"Name","value":"canClose"}},{"kind":"Field","name":{"kind":"Name","value":"doctor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<OwnSlotsQuery, OwnSlotsQueryVariables>;
export const CloseSlotDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CloseSlot"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slotId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"closeSlot"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slotId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slotId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"closedAt"}},{"kind":"Field","name":{"kind":"Name","value":"canClose"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"field"}}]}}]}}]}}]} as unknown as DocumentNode<CloseSlotMutation, CloseSlotMutationVariables>;
export const CreateSlotsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSlots"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSlotsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSlots"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createdCount"}},{"kind":"Field","name":{"kind":"Name","value":"skippedCount"}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"field"}}]}}]}}]}}]} as unknown as DocumentNode<CreateSlotsMutation, CreateSlotsMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"staffMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"clinic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;