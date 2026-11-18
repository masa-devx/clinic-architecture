import type { AppointmentFilter } from "@/lib/gql/graphql";
import { isDateString } from "@/lib/datetime";
import { isStatus } from "./status";

// 絞り込みは URL のクエリに置く（リロード・共有・戻るで消えない）。ここは、URL と GraphQL の引数の変換だけをする

export const FILTER_KEYS = ["from", "to", "doctor", "status"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

type Params = { get(name: string): string | null };

// URL は人が書き換えられるので、形が正しい値だけを通す。正しくない値は、指定がないものとして扱う
export function filterFromParams(params: Params): AppointmentFilter {
  const from = params.get("from");
  const to = params.get("to");
  const doctor = params.get("doctor");
  const status = params.get("status");
  return {
    ...(isDateString(from) ? { from } : {}),
    ...(isDateString(to) ? { to } : {}),
    ...(doctor && /^\d+$/.test(doctor) ? { doctorId: doctor } : {}),
    ...(isStatus(status) ? { status } : {}),
  };
}

// スタッフの一覧の絞り込み。URL に from がなければ「今日から」にする（今日の予約が、最初に出るように）。
// from= と空で書いてあれば、「いつからでも」（過去の予約も出す）
export function staffFilterFromParams(
  params: Params & { has(name: string): boolean },
  today: string,
): AppointmentFilter {
  const filter = filterFromParams(params);
  return params.has("from") ? filter : { ...filter, from: today };
}

// 今の URL のクエリから、1つの絞り込みを変えた（空なら外した）クエリの文字列を作る。
// from だけは、空にしても from= を残す（「今日から」に戻さず、「いつからでも」にするため）
export function withFilter(current: string, key: FilterKey, value: string): string {
  const params = new URLSearchParams(current);
  if (value || key === "from") params.set(key, value);
  else params.delete(key);
  return params.toString();
}
