// 予約と会計の状態の、画面での呼び方と色。3つの画面で同じ言葉・同じ色にする。
// 状態の一覧そのものは、サーバーのスキーマ（AppointmentStatus・BillStatus）が正。
// アプリの側で `satisfies Record<AppointmentStatus, string>` のように使うと、状態が増えたときに型のエラーで気づける

export const APPOINTMENT_STATUS_LABELS = {
  BOOKED: "予約済",
  CHECKED_IN: "受付済",
  IN_CONSULTATION: "診察中",
  COMPLETED: "診察済",
  CANCELED: "キャンセル",
  NO_SHOW: "無断キャンセル",
} as const;

export const APPOINTMENT_STATUS_COLORS = {
  BOOKED: "blue",
  CHECKED_IN: "teal",
  IN_CONSULTATION: "purple",
  COMPLETED: "green",
  CANCELED: "gray",
  NO_SHOW: "red",
} as const;

export const BILL_STATUS_LABELS = {
  DRAFT: "作成中",
  BILLED: "請求済",
  PAID: "支払い済",
  REFUNDED: "返金済",
} as const;

export const BILL_STATUS_COLORS = {
  DRAFT: "gray",
  BILLED: "orange",
  PAID: "green",
  REFUNDED: "purple",
} as const;

// 例: 1,460円
export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}
