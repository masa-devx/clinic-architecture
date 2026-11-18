import { expect, test } from "@playwright/test";
import { CLERK, CLERK_URL, OTHER_CLINIC_CLERK, PATIENT, PATIENT_URL } from "./seed";
import { cancelLeftovers, confirm, login, logout } from "./helpers";

test("患者が予約し、事務スタッフの一覧に出て、ほかの医療機関には出ず、患者がキャンセルする", async ({
  page,
}) => {
  await login(page, PATIENT_URL, PATIENT.email);
  await expect(page.getByRole("heading", { name: "自分の予約" })).toBeVisible();
  await cancelLeftovers(page);

  // 予約する: 医療機関を選び、時刻のボタンを押して、確認の窓で予約する
  await page.getByRole("link", { name: "予約する" }).first().click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  const times = page.getByRole("button", { name: /を予約する$/ });
  await expect(times.first()).toBeVisible();
  // 最初のページの最後の枠（数日先）。最初の枠は、走らせる時刻によっては、開始まで1時間を切っていて、患者がキャンセルできない
  const label = (await times.last().getAttribute("aria-label"))!;
  const [, date, time, doctor] = label.match(/^(\S+) (\S+) (\S+ \S+) を予約する$/)!;
  await times.last().click();
  await expect(page.getByRole("alertdialog")).toContainText(`${date} ${time}〜`);
  await confirm(page, "予約する");

  // 自分の予約に、カードで出る
  await expect(page).toHaveURL(/\/appointments$/);
  const card = page
    .getByRole("article", { name: `${date} ${time} ${doctor} の予約` })
    .filter({ hasText: "予約済" });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("さくら内科クリニック");

  // 予約した枠は、空いている枠から消えている
  await page.getByRole("link", { name: "予約する" }).first().click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  await expect(times.first()).toBeVisible();
  await expect(page.getByRole("button", { name: label })).toHaveCount(0);

  // 同じ医療機関の事務スタッフの一覧に、患者の名前つきで出る（同じブラウザで、患者の画面のログインは続いたまま）
  await login(page, CLERK_URL, CLERK.email);
  await page.getByLabel("状態").selectOption({ label: "予約済" });
  const row = page
    .getByRole("row")
    .filter({ hasText: PATIENT.name })
    .filter({ hasText: date! })
    .filter({ hasText: `${time}〜` });
  await expect(row).toHaveCount(1);
  await logout(page);

  // ほかの医療機関の事務スタッフの一覧には出ない
  await login(page, CLERK_URL, OTHER_CLINIC_CLERK.email);
  await expect(page.getByText(OTHER_CLINIC_CLERK.clinic)).toBeVisible();
  await expect(page.getByText("条件に合う予約はありません").or(page.getByRole("table"))).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: PATIENT.name })).toHaveCount(0);
  await logout(page);

  // 患者がキャンセルすると、枠はもう一度予約できるようになる
  await page.goto(`${PATIENT_URL}/appointments`);
  await card.getByRole("button", { name: "キャンセル" }).click();
  await confirm(page, "キャンセルする");
  await expect(page.getByText("予約をキャンセルしました")).toBeVisible();
  await expect(card).toHaveCount(0);

  await page.goto(`${PATIENT_URL}/book`);
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  await expect(page.getByRole("button", { name: label })).toBeVisible();
});

test("患者が、予約の時刻を変える", async ({ page }) => {
  await login(page, PATIENT_URL, PATIENT.email);
  await cancelLeftovers(page);

  await page.goto(`${PATIENT_URL}/book`);
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  const times = page.getByRole("button", { name: /を予約する$/ });
  await expect(times.first()).toBeVisible();
  const before = (await times.last().getAttribute("aria-label"))!.match(/^(\S+) (\S+) (\S+ \S+) を/)!;
  await times.last().click();
  await confirm(page, "予約する");
  const cardOf = (m: RegExpMatchArray) =>
    page.getByRole("article", { name: `${m[1]} ${m[2]} ${m[3]} の予約` }).filter({ hasText: "予約済" });
  await expect(cardOf(before)).toHaveCount(1);

  await cardOf(before).getByRole("link", { name: "時刻を変える" }).click();
  await expect(page.getByText("予約の時刻を変えます")).toBeVisible();
  const choices = page.getByRole("button", { name: /を選ぶ（この時刻に変える）$/ });
  await expect(choices.first()).toBeVisible();
  const after = (await choices.nth((await choices.count()) - 4).getAttribute("aria-label"))!.match(
    /^(\S+) (\S+) (\S+ \S+) を/,
  )!;
  await choices.nth((await choices.count()) - 4).click();
  await confirm(page, "この時刻に変える");

  // 予約は1件のまま、新しい枠に変わる
  await expect(page).toHaveURL(/\/appointments$/);
  await expect(cardOf(after)).toHaveCount(1);
  await expect(cardOf(before)).toHaveCount(0);
  await expect(page.getByRole("article").filter({ hasText: "予約済" })).toHaveCount(1);
});

test("事務スタッフが、患者の代わりに予約を入れ、枠を閉じる", async ({ page }) => {
  await login(page, CLERK_URL, CLERK.email);
  await page.getByRole("link", { name: "空いている枠" }).click();
  const choices = page.getByRole("button", { name: /を選ぶ（代わりに予約する）$/ });
  await expect(choices.first()).toBeVisible();

  // メールアドレスを入れずに押すと、送らずに止める。登録のないメールアドレスは、断られる
  await choices.last().click();
  await expect(page.getByText("患者のメールアドレスを入れてください")).toBeVisible();
  await page.getByLabel("代わりに予約を入れる患者のメールアドレス").fill("nobody@example.com");
  await choices.last().click();
  await expect(page.getByText("このメールアドレスの患者が見つかりません")).toBeVisible();

  await page.getByLabel("代わりに予約を入れる患者のメールアドレス").fill(PATIENT.email);
  const target = (await choices.last().getAttribute("aria-label"))!.match(/^(\S+) (\S+) (\S+ \S+) を/)!;
  await choices.last().click();
  await expect(page.getByText("予約しました")).toBeVisible();

  // 空いている枠を1つ閉じると、一覧から消える
  const closes = page.getByRole("button", { name: /を閉じる$/ });
  const closing = (await closes.last().getAttribute("aria-label"))!;
  await closes.last().click();
  await confirm(page, "閉じる");
  await expect(page.getByText("枠を閉じました")).toBeVisible();
  await expect(page.getByRole("button", { name: closing })).toHaveCount(0);

  // 予約の一覧に、「代理」の印つきで出る。あとの実行に残さないように、キャンセルしておく
  await page.getByRole("link", { name: "予約の一覧" }).click();
  await page.getByLabel("状態").selectOption({ label: "予約済" });
  const row = page
    .getByRole("row")
    .filter({ hasText: PATIENT.name })
    .filter({ hasText: target[1] })
    .filter({ hasText: `${target[2]}〜` })
    .filter({ hasText: "（代理）" });
  await expect(row).toHaveCount(1);
  await row.getByRole("button", { name: "キャンセル" }).click();
  await confirm(page, "キャンセルする");
  await expect(page.getByText("予約をキャンセルしました")).toBeVisible();
});

test("ログインは、画面ごとに別。患者は、事務スタッフの画面にログインできない", async ({ page }) => {
  await page.goto(`${PATIENT_URL}/appointments`);
  await expect(page).toHaveURL(/\/login$/);
  await page.goto(`${CLERK_URL}/appointments`);
  await expect(page).toHaveURL(/\/login$/);

  // 患者のメールアドレスで、事務スタッフの画面にはログインできない
  await page.getByLabel("メールアドレス").fill(PATIENT.email);
  await page.getByLabel("パスワード").fill("password-for-local-only");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByText("メールアドレスかパスワードが違います")).toBeVisible();

  // 患者の画面にログインしても、事務スタッフの画面は、ログインしていないまま
  await login(page, PATIENT_URL, PATIENT.email);
  await page.goto(`${CLERK_URL}/appointments`);
  await expect(page).toHaveURL(/\/login$/);
});

test("スタッフの一覧の絞り込みは URL に残り、リロードしても消えない", async ({ page }) => {
  await login(page, CLERK_URL, CLERK.email);

  await page.getByLabel("状態").selectOption({ label: "キャンセル" });
  await expect(page).toHaveURL(/status=CANCELED/);

  await page.reload();
  await expect(page.getByLabel("状態")).toHaveValue("CANCELED");
  await expect(page.getByText("条件に合う予約はありません").or(page.getByRole("table"))).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "予約済" })).toHaveCount(0);
});
