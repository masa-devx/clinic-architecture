import type { BillStatus } from "@/lib/gql/graphql";

// 会計の状態の、画面での呼び方と色。予約の一覧と会計の画面の両方で使うので、lib に置く。
// 状態の一覧そのものは、サーバーのスキーマ（BillStatus）が正
export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  DRAFT: "作成中",
  BILLED: "請求済",
  PAID: "支払い済",
  REFUNDED: "返金済",
};

export const BILL_STATUS_COLORS: Record<BillStatus, string> = {
  DRAFT: "gray",
  BILLED: "orange",
  PAID: "green",
  REFUNDED: "purple",
};

// 例: 1,460円
export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}
