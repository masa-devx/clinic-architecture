import { describe, expect, it } from "vitest";
import { draftTotal, quantitiesFrom, toInput } from "./bill-items";

const feeItems = [
  { id: "1", name: "初診料", unitPrice: 2880 },
  { id: "2", name: "処方箋料", unitPrice: 680 },
];

describe("会計の明細の計算", () => {
  it("保存してある明細から、同じ名前・同じ値段の項目の数量を戻す", () => {
    expect(quantitiesFrom(feeItems, [{ name: "処方箋料", unitPrice: 680, quantity: 2 }])).toEqual({ "2": 2 });
  });

  it("料金の表の値段が変わった項目は、戻さない", () => {
    expect(quantitiesFrom(feeItems, [{ name: "初診料", unitPrice: 2700, quantity: 1 }])).toEqual({});
  });

  it("送るのは、数量が1以上の整数の項目だけ", () => {
    expect(toInput({ "1": 1, "2": 0 })).toEqual([{ feeItemId: "1", quantity: 1 }]);
    expect(toInput({ "1": Number.NaN, "2": -1 })).toEqual([]);
    expect(toInput({ "1": 1.5 })).toEqual([]);
  });

  it("入力中の合計は、単価 × 数量の合計。空・マイナスは0として数える", () => {
    expect(draftTotal(feeItems, { "1": 1, "2": 2 })).toBe(2880 + 680 * 2);
    expect(draftTotal(feeItems, {})).toBe(0);
    expect(draftTotal(feeItems, { "1": -3, "2": Number.NaN })).toBe(0);
  });
});
