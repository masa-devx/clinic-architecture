import { z } from "zod";
import { isDateString } from "@/lib/datetime";

// 診療枠をまとめて作るフォームの検証。「送る前に気づける誤り」だけを見る。
// 上限（期間・枠の数）や、過去の日・権限は、サーバーが確かめて、項目つきのエラーで返す
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時刻を入れてください");
const date = z.string().refine(isDateString, "日付を入れてください");

export const WEEKDAYS = [
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
  { value: 0, label: "日" },
] as const;

export const createSlotsSchema = z
  .object({
    doctorId: z.string().min(1, "医師を選んでください"),
    from: date,
    to: date,
    weekdays: z.array(z.number().int().min(0).max(6)).min(1, "曜日を1つ以上選んでください"),
    startTime: time,
    endTime: time,
    slotMinutes: z
      .number({ error: "数字を入れてください" })
      .int("整数で入れてください")
      .min(5, "5分以上にしてください")
      .max(240, "240分以下にしてください"),
  })
  // HH:MM と YYYY-MM-DD は、文字のまま比べても、時刻・日付の前後と同じ順になる
  .refine((values) => values.to >= values.from, {
    path: ["to"],
    message: "終了日は、開始日より前にできません",
  })
  .refine((values) => values.endTime > values.startTime, {
    path: ["endTime"],
    message: "終了時刻は、開始時刻より後にしてください",
  });

export type CreateSlotsValues = z.infer<typeof createSlotsSchema>;
