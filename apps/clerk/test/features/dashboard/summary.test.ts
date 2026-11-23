import { describe, expect, it } from "vitest";
import { cancelRate, rangeFrom, totalOf } from "@/features/dashboard/summary";

// テストする所: ダッシュボードの計算

// 日と医師ごとの集計の行（サーバーが返す形）
const rows = [
  { total: 6, canceled: 1, noShow: 1, completed: 3, revenue: 3000 },
  { total: 1, canceled: 1, noShow: 0, completed: 0, revenue: 0 },
];

describe("正常系", () => {
  it("行を足し合わせて、期間の合計にする。行がなければ、すべて0", () => {
    expect(totalOf(rows)).toEqual({ total: 7, canceled: 2, noShow: 1, completed: 3, revenue: 3000 });
    expect(totalOf([])).toEqual({ total: 0, canceled: 0, noShow: 0, completed: 0, revenue: 0 });
  });

  it("キャンセルの割合は、小数1桁の%。予約がなければ「—」", () => {
    expect(cancelRate({ total: 7, canceled: 2 })).toBe("28.6%");
    expect(cancelRate({ total: 3, canceled: 0 })).toBe("0.0%");
    expect(cancelRate({ total: 0, canceled: 0 })).toBe("—");
  });

  it("期間の指定がなければ、今日までの7日間", () => {
    expect(rangeFrom(new URLSearchParams(""), "2030-01-07")).toEqual({
      from: "2030-01-01",
      to: "2030-01-07",
      error: null,
    });
    expect(rangeFrom(new URLSearchParams("to=2030-02-03"), "2030-01-07")).toMatchObject({
      from: "2030-01-28",
      to: "2030-02-03",
    });
    expect(rangeFrom(new URLSearchParams("from=きのう&to=2030-02-31"), "2030-01-07")).toMatchObject({
      from: "2030-01-01",
      to: "2030-01-07",
    });
  });
});

describe("異常系", () => {
  it("期間は31日まで。32日・逆向きは、理由を返す", () => {
    expect(rangeFrom(new URLSearchParams("from=2030-01-01&to=2030-01-31"), "2030-01-07").error).toBeNull();
    expect(rangeFrom(new URLSearchParams("from=2030-01-01&to=2030-02-01"), "2030-01-07").error).toBe(
      "期間は、31日までにしてください",
    );
    expect(rangeFrom(new URLSearchParams("from=2030-01-08&to=2030-01-07"), "2030-01-07").error).toContain(
      "より前に",
    );
    expect(rangeFrom(new URLSearchParams("from=2030-01-07&to=2030-01-07"), "2030-01-07").error).toBeNull();
  });
});
