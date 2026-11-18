import { addDays, isDateString } from "@clinic/web-kit/datetime";

// ダッシュボードの、画面の中での計算。通信もしないし、時計も読まない

export const MAX_DAYS = 31;

type Counts = { total: number; canceled: number; noShow: number; completed: number; revenue: number };

// 行（日ごと・医師ごと）を足し合わせて、期間の合計にする
export function totalOf(rows: readonly Counts[]): Counts {
  return rows.reduce(
    (sum, row) => ({
      total: sum.total + row.total,
      canceled: sum.canceled + row.canceled,
      noShow: sum.noShow + row.noShow,
      completed: sum.completed + row.completed,
      revenue: sum.revenue + row.revenue,
    }),
    { total: 0, canceled: 0, noShow: 0, completed: 0, revenue: 0 },
  );
}

// キャンセルの割合（%。小数1桁）。予約が1件もなければ「—」
export function cancelRate({ total, canceled }: { total: number; canceled: number }): string {
  return total === 0 ? "—" : `${((canceled / total) * 100).toFixed(1)}%`;
}

// URL の from・to から、集計する期間を決める。指定がない・形が正しくなければ、今日までの7日間。
// 逆向き・31日より長い期間は、error に理由を入れて返す（そのときは、集計を頼まない）
export function rangeFrom(
  params: { get(name: string): string | null },
  today: string,
): { from: string; to: string; error: string | null } {
  const toParam = params.get("to");
  const fromParam = params.get("from");
  const to = isDateString(toParam) ? toParam : today;
  const from = isDateString(fromParam) ? fromParam : addDays(to, -6);
  if (from > to) return { from, to, error: "「この日から」は、「この日まで」より前にしてください" };
  if (addDays(from, MAX_DAYS - 1) < to) return { from, to, error: `期間は、${MAX_DAYS}日までにしてください` };
  return { from, to, error: null };
}
