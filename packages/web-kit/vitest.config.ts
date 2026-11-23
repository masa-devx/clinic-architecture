import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // テストは test/ にまとめる（src と同じ並び）。テストの準備（src/test/）は、ほかのパッケージからも使うので src に置く
    include: ["test/**/*.test.{ts,tsx}"],
    // どこで走らせても、日付の計算が同じ結果になるようにする（CI は UTC、手元は日本時間）
    env: { TZ: "UTC" },
  },
});
