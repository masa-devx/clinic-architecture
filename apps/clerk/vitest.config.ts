import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["@clinic/web-kit/test/setup"],
    // テストは test/ にまとめる（features・lib と同じ並び）
    include: ["test/**/*.test.{ts,tsx}"],
    // どこで走らせても、日付の計算が同じ結果になるようにする（CI は UTC、手元は日本時間）
    env: { TZ: "UTC" },
    server: { deps: { inline: ["@clinic/web-kit", "@clinic/ui"] } },
  },
});
