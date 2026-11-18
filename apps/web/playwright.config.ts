import { defineConfig, devices } from "@playwright/test";

// E2E は、止まると困る流れだけに絞る（ログイン → 予約 → キャンセル）。細かい分岐は、単体と部品のテストで守る
// 先に、API と DB を起動して、初期データを入れ直しておく（ルートの pnpm e2e が、db:seed を流してから走らせる）。
// 初期データの枠は「入れた日の翌日から14日分」なので、入れ直さないと、日がたつと空き枠がなくなる。画面は、動いていなければここで起動する
export default defineConfig({
  testDir: "./e2e",
  // 同じ初期データ（同じ患者・同じ枠）を使うので、並べて走らせない
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
