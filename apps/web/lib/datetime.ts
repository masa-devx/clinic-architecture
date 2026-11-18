// 日付と時刻の見せ方。画面は、どこで開いても日本時間で出す（予約の時刻は、医療機関の現地の時刻）
const TIME_ZONE = "Asia/Tokyo";

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  month: "numeric",
  day: "numeric",
  weekday: "short",
});
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const isoDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 例: 1/7(月)
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

// 例: 09:30
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

// 例: 1/7(月) 09:30
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

// 日本時間での日付（YYYY-MM-DD）。GraphQL の日付の引数に、そのまま渡せる形
export function toDateInTokyo(at: Date): string {
  return isoDateFormat.format(at);
}

// YYYY-MM-DD に日数を足す。暦の計算なので、時刻とタイムゾーンは関わらない
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year!, month! - 1, day! + days));
  return result.toISOString().slice(0, 10);
}

export function isDateString(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // 2030-02-31 のような、ない日を弾く
  return addDays(value, 0) === value;
}
