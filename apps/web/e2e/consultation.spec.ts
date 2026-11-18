import { expect, test, type Page } from "@playwright/test";
import { CLERK, DOCTOR, PASSWORD, PATIENT } from "./seed";

async function login(page: Page, path: "/login" | "/staff/login", email: string) {
  await page.goto(path);
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
}

// 日本時間の「今から minutes 分後」の、日付（YYYY-MM-DD）と時刻（HH:MM）
function tokyo(minutes: number) {
  const at = new Date(Date.now() + minutes * 60_000 + 9 * 3_600_000).toISOString();
  return { date: at.slice(0, 10), time: at.slice(11, 16) };
}

test("受付 → 診察 → 会計の確定 → 支払い済まで、通しで進む", async ({ page }) => {
  // 受付できるのは開始の30分前からなので、3分後に始まる30分の枠を、ここで作って使う。
  // サーバーの時計は変えられないので、日付をまたぐ時間帯（日本時間の23:25以降）だけは、枠を作れず確かめられない
  const start = tokyo(3);
  const end = tokyo(33);
  test.skip(end.date !== start.date, "日本時間の23:25以降は、今日のうちに終わる枠を作れない");

  await login(page, "/staff/login", DOCTOR.email);
  await page.getByRole("link", { name: "診療枠を作る" }).click();
  await page.getByLabel("開始日").fill(start.date);
  await page.getByLabel("終了日").fill(start.date);
  // 今日が何曜日でも作れるように、土日にもチェックを入れる（月〜金は最初から入っている）
  await page.getByText("土", { exact: true }).click();
  await page.getByText("日", { exact: true }).click();
  await page.getByLabel("開始時刻").fill(start.time);
  await page.getByLabel("終了時刻").fill(end.time);
  await page.getByRole("button", { name: "診療枠を作る" }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 枠を作りました" })).toBeVisible();
  await logout(page);

  // 患者が、その枠を予約して、受付する
  await login(page, "/login", PATIENT.email);
  await page.getByRole("link", { name: "予約する" }).click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  await page
    .getByRole("button", { name: new RegExp(` ${start.time} ${DOCTOR.name} を予約する$`) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/appointments$/);
  const row = page
    .getByRole("row")
    .filter({ hasText: `${start.time}〜${end.time}` })
    .filter({ hasText: DOCTOR.name });
  await row.getByRole("button", { name: "受付する" }).click();
  await expect(row).toContainText("受付済");
  // 受付したあとは、患者はキャンセルも時刻の変更もできない
  await expect(row.getByRole("button", { name: "キャンセル" })).toHaveCount(0);
  await logout(page);

  // 医師が、診察を始めて、終える
  await login(page, "/staff/login", DOCTOR.email);
  await row.getByRole("button", { name: "診察を始める" }).click();
  await expect(row).toContainText("診察中");
  await row.getByRole("button", { name: "診察を終える" }).click();
  await expect(row).toContainText("診察済");
  // 医師には、会計は見えない
  await expect(row.getByRole("link")).toHaveCount(0);
  await logout(page);

  // 事務スタッフが、会計の明細を入れて、確定し、支払い済にする
  await login(page, "/staff/login", CLERK.email);
  await row.getByRole("link", { name: /作成中/ }).click();
  await expect(page.getByRole("heading", { name: "会計", exact: true })).toBeVisible();
  // 明細がないあいだは、確定できない
  await expect(page.getByRole("button", { name: "会計を確定する" })).toBeDisabled();
  await page.getByLabel("再診料 の数量").fill("1");
  await page.getByLabel("処方箋料 の数量").fill("2");
  await expect(page.getByText("入力中の合計（目安）: 2,090円")).toBeVisible();
  // 保存していない入力があるあいだも、確定できない
  await expect(page.getByRole("button", { name: "会計を確定する" })).toBeDisabled();
  await page.getByRole("button", { name: "明細を保存する" }).click();
  await expect(page.getByText("明細を保存しました")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "会計を確定する" }).click();
  await expect(page.getByText("合計 2,090円")).toBeVisible();
  await expect(page.getByLabel("再診料 の数量")).toHaveCount(0);
  await page.getByRole("button", { name: "支払い済にする" }).click();
  await expect(page.getByText("支払い済", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "返金済にする" })).toBeVisible();
  await logout(page);

  // 患者が、確定した会計を見る。操作のボタンは出ない
  await login(page, "/login", PATIENT.email);
  await row.getByRole("link", { name: /支払い済/ }).click();
  await expect(page.getByText("合計 2,090円")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "処方箋料" })).toContainText("1,360円");
  await expect(page.getByRole("button", { name: "返金済にする" })).toHaveCount(0);
});
