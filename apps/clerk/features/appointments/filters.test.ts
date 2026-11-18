import { describe, expect, it } from "vitest";
import { filterFromParams, staffFilterFromParams, withFilter } from "./filters";

describe("予約の一覧の絞り込み（URL との変換）", () => {
  it("URL のクエリを、GraphQL の絞り込みに変える", () => {
    const params = new URLSearchParams("from=2030-01-07&to=2030-01-08&doctor=3&status=CANCELED");

    expect(filterFromParams(params)).toEqual({
      from: "2030-01-07",
      to: "2030-01-08",
      doctorId: "3",
      status: "CANCELED",
    });
  });

  it("指定がなければ、空の絞り込みになる", () => {
    expect(filterFromParams(new URLSearchParams(""))).toEqual({});
  });

  it("形が正しくない値は、指定がないものとして扱う（URL は人が書き換えられる）", () => {
    const params = new URLSearchParams("from=きのう&to=2030-02-31&doctor=1 OR 1=1&status=booked");

    expect(filterFromParams(params)).toEqual({});
  });

  it("1つの絞り込みを変えても、ほかの絞り込みは残る", () => {
    expect(withFilter("from=2030-01-07&status=BOOKED", "status", "CANCELED")).toBe(
      "from=2030-01-07&status=CANCELED",
    );
    expect(withFilter("from=2030-01-07", "doctor", "3")).toBe("from=2030-01-07&doctor=3");
  });

  it("スタッフの一覧は、from の指定がなければ今日から。from を空にしてあれば、いつからでも", () => {
    const today = "2030-01-07";

    expect(staffFilterFromParams(new URLSearchParams(""), today)).toEqual({ from: today });
    expect(staffFilterFromParams(new URLSearchParams("status=BOOKED"), today)).toEqual({
      from: today,
      status: "BOOKED",
    });
    expect(staffFilterFromParams(new URLSearchParams("from=2030-01-01"), today)).toEqual({
      from: "2030-01-01",
    });
    expect(staffFilterFromParams(new URLSearchParams("from="), today)).toEqual({});
  });

  it("from を空にすると、from= が残る（今日からに戻さない）", () => {
    expect(withFilter("from=2030-01-07&status=BOOKED", "from", "")).toBe("from=&status=BOOKED");
    expect(withFilter("", "from", "")).toBe("from=");
  });

  it("空にすると、その絞り込みだけが外れる", () => {
    expect(withFilter("from=2030-01-07&status=BOOKED", "status", "")).toBe("from=2030-01-07");
    expect(withFilter("status=BOOKED", "status", "")).toBe("");
  });
});
