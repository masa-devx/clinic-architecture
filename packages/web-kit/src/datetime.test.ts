import { describe, expect, it } from "vitest";
import { addDays, formatDate, formatDateTime, formatTime, isDateString, toDateInTokyo } from "./datetime";

describe("日付と時刻の見せ方", () => {
  it("どこで開いても、日本時間で出す", () => {
    // UTC の 1/6 15:00 は、日本時間の 1/7 0:00（月曜）
    expect(formatDate("2030-01-06T15:00:00Z")).toBe("1/7(月)");
    expect(formatTime("2030-01-06T15:00:00Z")).toBe("00:00");
    expect(formatDateTime("2030-01-07T09:30:00+09:00")).toBe("1/7(月) 09:30");
  });

  it("日本時間の日付は、UTC の日付と、15時を境にずれる", () => {
    expect(toDateInTokyo(new Date("2030-01-06T14:59:59Z"))).toBe("2030-01-06");
    expect(toDateInTokyo(new Date("2030-01-06T15:00:00Z"))).toBe("2030-01-07");
  });

  it("日数を足すと、月末・年末・うるう年をまたぐ", () => {
    expect(addDays("2030-01-31", 1)).toBe("2030-02-01");
    expect(addDays("2030-12-31", 1)).toBe("2031-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2030-03-01", -1)).toBe("2030-02-28");
    expect(addDays("2030-01-07", 0)).toBe("2030-01-07");
  });

  it("YYYY-MM-DD の形で、実際にある日だけを通す", () => {
    expect(isDateString("2030-01-07")).toBe(true);
    expect(isDateString("2030-02-31")).toBe(false);
    expect(isDateString("2030-1-7")).toBe(false);
    expect(isDateString("")).toBe(false);
    expect(isDateString(null)).toBe(false);
  });
});
