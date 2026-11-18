import type { AppointmentStatus } from "@/lib/gql/graphql";

// 予約の状態の、画面での呼び方と色。状態の一覧そのものは、サーバーのスキーマ（AppointmentStatus）が正
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  BOOKED: "予約済",
  CHECKED_IN: "受付済",
  IN_CONSULTATION: "診察中",
  COMPLETED: "診察済",
  CANCELED: "キャンセル",
  NO_SHOW: "無断キャンセル",
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  BOOKED: "blue",
  CHECKED_IN: "teal",
  IN_CONSULTATION: "purple",
  COMPLETED: "green",
  CANCELED: "gray",
  NO_SHOW: "red",
};

export const STATUSES = Object.keys(STATUS_LABELS) as AppointmentStatus[];

export function isStatus(value: string | null | undefined): value is AppointmentStatus {
  return !!value && value in STATUS_LABELS;
}
