import { expect, test } from "@playwright/test";
import { CLERK, CLERK_URL, DOCTOR, DOCTOR_URL, PATIENT, PATIENT_URL } from "./seed";
import { cancelLeftovers, confirm, login, tokyo } from "./helpers";

test("受付 → 診察 → 会計の確定 → 支払い済まで、3つの画面で通しで進む", async ({ page }) => {
  // 受付できるのは開始の30分前からなので、3分後に始まる30分の枠を、ここで作って使う。
  // サーバーの時計は変えられないので、日付をまたぐ時間帯（日本時間の23:25以降）だけは、枠を作れず確かめられない
  const start = tokyo(new Date(Date.now() + 3 * 60_000));
  const end = tokyo(new Date(Date.now() + 33 * 60_000));
  test.skip(end.date !== start.date, "日本時間の23:25以降は、今日のうちに終わる枠を作れない");

  // 医師: 自分の枠を作る
  await login(page, DOCTOR_URL, DOCTOR.email);
  await page.getByRole("link", { name: "診療枠を作る" }).click();
  // 医師の欄に出るのは、自分だけ
  await expect(page.getByLabel("医師").getByRole("option")).toHaveText([DOCTOR.name]);
  await page.getByLabel("開始日").fill(start.date);
  await page.getByLabel("終了日").fill(start.date);
  // 今日が何曜日でも作れるように、土日にもチェックを入れる（月〜金は最初から入っている）
  await page.getByText("土", { exact: true }).click();
  await page.getByText("日", { exact: true }).click();
  await page.getByLabel("開始時刻").fill(start.time);
  await page.getByLabel("終了時刻").fill(end.time);
  await page.getByRole("button", { name: "診療枠を作る" }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 枠を作りました" })).toBeVisible();

  // 患者: その枠を予約して、受付する
  await login(page, PATIENT_URL, PATIENT.email);
  await cancelLeftovers(page);
  await page.getByRole("link", { name: "予約する" }).first().click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  await page
    .getByRole("button", { name: new RegExp(` ${start.time} ${DOCTOR.name} を予約する$`) })
    .first()
    .click();
  await confirm(page, "予約する");
  await expect(page).toHaveURL(/\/appointments$/);
  const card = page
    .getByRole("article", { name: new RegExp(` ${start.time} ${DOCTOR.name} の予約$`) })
    .first();
  await card.getByRole("button", { name: "受付する" }).click();
  await expect(card).toContainText("受付済");
  // 受付したあとは、患者はキャンセルも時刻の変更もできない
  await expect(card.getByRole("button", { name: "キャンセル" })).toHaveCount(0);

  // 医師: 今日の予定から、診察を始めて、終える
  await page.goto(`${DOCTOR_URL}/appointments`);
  const item = page.getByRole("article", { name: `${start.time} ${PATIENT.name}` });
  await expect(item).toContainText("受付済");
  await item.getByRole("button", { name: "診察を始める" }).click();
  await expect(item).toContainText("診察中");
  await item.getByRole("button", { name: "診察を終える" }).click();
  await confirm(page, "診察を終える");
  await expect(item).toContainText("診察済");

  // 事務スタッフ: 会計の明細を入れて、確定し、支払い済にする
  await login(page, CLERK_URL, CLERK.email);
  const row = page
    .getByRole("row")
    .filter({ hasText: PATIENT.name })
    .filter({ hasText: `${start.time}〜${end.time}` });
  await row.getByRole("link", { name: /明細を入れる/ }).click();
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
  await page.getByRole("button", { name: "会計を確定する" }).click();
  await confirm(page, "確定する");
  await expect(page.getByText("合計 2,090円")).toBeVisible();
  await expect(page.getByLabel("再診料 の数量")).toHaveCount(0);
  await page.getByRole("button", { name: "支払い済にする" }).click();
  await expect(page.getByRole("button", { name: "返金済にする" })).toBeVisible();

  // 患者: 確定した会計を見る。操作のボタンは出ない
  await page.goto(`${PATIENT_URL}/appointments`);
  await expect(card).toContainText("支払い済");
  await card.getByRole("link", { name: "明細を見る" }).click();
  await expect(page.getByText("合計 2,090円")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "処方箋料" })).toContainText("1,360円");
  await expect(page.getByRole("button", { name: "返金済にする" })).toHaveCount(0);
});
