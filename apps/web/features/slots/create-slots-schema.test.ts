import { describe, expect, it } from "vitest";
import { createSlotsSchema } from "./create-slots-schema";

const valid = {
  doctorId: "1",
  from: "2030-01-07",
  to: "2030-01-20",
  weekdays: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "12:00",
  slotMinutes: 30,
};

function errorPaths(values: unknown): string[] {
  const result = createSlotsSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("診療枠をまとめて作るフォームの検証", () => {
  it("正しい入力は通る", () => {
    expect(errorPaths(valid)).toEqual([]);
  });

  it("開始日と終了日が同じ日でも通る。終了日が前なら、終了日のエラーになる", () => {
    expect(errorPaths({ ...valid, to: "2030-01-07" })).toEqual([]);
    expect(errorPaths({ ...valid, to: "2030-01-06" })).toEqual(["to"]);
  });

  it("終了時刻が開始時刻と同じか前なら、終了時刻のエラーになる", () => {
    expect(errorPaths({ ...valid, endTime: "09:00" })).toEqual(["endTime"]);
    expect(errorPaths({ ...valid, endTime: "08:59" })).toEqual(["endTime"]);
    expect(errorPaths({ ...valid, endTime: "09:01" })).toEqual([]);
  });

  it("曜日が1つもなければ、曜日のエラーになる", () => {
    expect(errorPaths({ ...valid, weekdays: [] })).toEqual(["weekdays"]);
  });

  it("1枠の長さは、5分から240分まで", () => {
    expect(errorPaths({ ...valid, slotMinutes: 4 })).toEqual(["slotMinutes"]);
    expect(errorPaths({ ...valid, slotMinutes: 5 })).toEqual([]);
    expect(errorPaths({ ...valid, slotMinutes: 240 })).toEqual([]);
    expect(errorPaths({ ...valid, slotMinutes: 241 })).toEqual(["slotMinutes"]);
    expect(errorPaths({ ...valid, slotMinutes: Number.NaN })).toEqual(["slotMinutes"]);
  });

  it("空の入力は、項目ごとのエラーになる", () => {
    expect(errorPaths({ ...valid, doctorId: "", from: "", startTime: "" })).toEqual(
      expect.arrayContaining(["doctorId", "from", "startTime"]),
    );
  });
});
