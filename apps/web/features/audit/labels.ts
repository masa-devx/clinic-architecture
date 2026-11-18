import type { AuditAction, ViewerKind } from "@/lib/gql/graphql";

// 監査ログの操作の、画面での呼び方。操作の一覧そのものは、サーバーのスキーマ（AuditAction）が正。
// 操作が増えると、ここに足すまで型のエラーになる
export const ACTION_LABELS: Record<AuditAction, string> = {
  APPOINTMENT_BOOK: "予約した",
  APPOINTMENT_CANCEL: "予約をキャンセルした",
  APPOINTMENT_RESCHEDULE: "予約の時刻を変えた",
  APPOINTMENT_CHECK_IN: "受付した",
  APPOINTMENT_START: "診察を始めた",
  APPOINTMENT_FINISH: "診察を終えた",
  APPOINTMENT_NO_SHOW: "無断キャンセルにした",
  QUESTIONNAIRE_SAVE: "問診を保存した",
  QUESTIONNAIRE_VIEW: "問診を見た",
  BILL_UPDATE_ITEMS: "会計の明細を変えた",
  BILL_CONFIRM: "会計を確定した",
  BILL_PAY: "会計を支払い済にした",
  BILL_REFUND: "会計を返金済にした",
  BILL_VIEW: "会計を見た",
};

export const KIND_LABELS: Record<ViewerKind, string> = {
  PATIENT: "患者",
  DOCTOR: "医師",
  CLERK: "事務スタッフ",
};
