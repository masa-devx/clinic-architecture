import { defineConfig, devices } from "@playwright/test";

// E2E は、止まると困る流れだけに絞る（予約 → 受付 → 診察 → 会計、と、医療機関ごとの分離）。
// 細かい分岐は、RSpec と、アプリごとの部品のテストで守る。
// 先に、API と DB を起動して、初期データを入れ直しておく（ルートの pnpm e2e が、db:seed を流してから走らせる）。
// 3つの画面は、動いていなければ、ここで起動する
const apps = [
  { name: "patient", port: 3000 },
  { name: "clerk", port: 3010 },
  { name: "doctor", port: 3020 },
];

export default defineConfig({
  testDir: "./tests",
  // 同じ初期データ（同じ患者・同じ枠）を使うので、並べて走らせない
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 手元は開発用のサーバー（すでに pnpm dev で動いていれば、それを使う）。
  // CI は、先に組み立ててから本番の形で起動する。開発用だと、ページを初めて開いたときに組み立てが走り、
  // その待ち時間で、たまに5秒の待ちを超えて落ちたため（2026-11-19）
  webServer: apps.map((app) => ({
    command: process.env.CI
      ? `pnpm --filter ${app.name} build && pnpm --filter ${app.name} start`
      : `pnpm --filter ${app.name} dev`,
    cwd: "..",
    url: `http://localhost:${app.port}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  })),
});
