// 会計の明細の、画面の中での計算。通信もしないし、時計も読まない

type FeeItem = { id: string; name: string; unitPrice: number };
type SavedItem = { name: string; unitPrice: number; quantity: number };

// 料金の項目の id → 数量。0 と空は「入れない」
export type Quantities = Record<string, number>;

// 保存してある明細から、入力欄の最初の数量を作る。
// 明細は、名前と値段を料金の表から写したものなので、名前と値段が同じ項目に戻す。
// 料金の表をあとで変えた項目は、戻せない（入力欄は空になる。保存してある明細そのものは、下の表に出ている）
export function quantitiesFrom(feeItems: readonly FeeItem[], saved: readonly SavedItem[]): Quantities {
  const quantities: Quantities = {};
  for (const feeItem of feeItems) {
    const match = saved.find((item) => item.name === feeItem.name && item.unitPrice === feeItem.unitPrice);
    if (match) quantities[feeItem.id] = match.quantity;
  }
  return quantities;
}

// サーバーへ送る形。数量が1以上の項目だけ
export function toInput(quantities: Quantities): { feeItemId: string; quantity: number }[] {
  return Object.entries(quantities)
    .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0)
    .map(([feeItemId, quantity]) => ({ feeItemId, quantity }));
}

// 入力中の合計（円）。確定の前に、目安として出す。確定した合計は、サーバーが決める
export function draftTotal(feeItems: readonly FeeItem[], quantities: Quantities): number {
  return feeItems.reduce(
    (sum, feeItem) => sum + feeItem.unitPrice * Math.max(0, quantities[feeItem.id] || 0),
    0,
  );
}
