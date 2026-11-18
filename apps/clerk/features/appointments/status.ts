import { APPOINTMENT_STATUS_LABELS } from "@clinic/web-kit/labels";
import type { AppointmentStatus } from "@/lib/gql/graphql";

// 状態の一覧は、サーバーのスキーマ（AppointmentStatus）が正。呼び方は、3つの画面で共通（web-kit）。
// スキーマに状態が増えると、ここで型のエラーになる
export const STATUS_LABELS = APPOINTMENT_STATUS_LABELS satisfies Record<AppointmentStatus, string>;

export const STATUSES = Object.keys(STATUS_LABELS) as AppointmentStatus[];

export function isStatus(value: string | null | undefined): value is AppointmentStatus {
  return !!value && value in STATUS_LABELS;
}
