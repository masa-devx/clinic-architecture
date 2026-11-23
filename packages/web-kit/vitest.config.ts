import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // どこで走らせても、日付の計算が同じ結果になるようにする（CI は UTC、手元は日本時間）
    env: { TZ: "UTC" },
  },
});
