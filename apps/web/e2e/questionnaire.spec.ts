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

// 前の実行やほかのテストが残した予約を、片付ける（ログインしている患者の「予約済」を、全部キャンセルする）
async function cancelLeftovers(page: Page) {
  const post = async (query: string, variables: Record<string, unknown> = {}) =>
    (await (await page.request.post("/graphql", { data: { query, variables } })).json()).data;
  const data = await post(
    `{ appointments(filter: { status: BOOKED }, first: 50) { edges { node { id } } } }`,
  );
  for (const edge of data.appointments.edges) {
    await post(`mutation($id: ID!) { cancelAppointment(appointmentId: $id) { errors { code } } }`, {
      id: edge.node.id,
    });
  }
}

test("患者が問診に答え、担当の医師が読む。事務スタッフには見えない", async ({ page }) => {
  await login(page, "/login", PATIENT.email);
  await cancelLeftovers(page);

  // 佐藤医師の、数日先の枠を予約する
  await page.getByRole("link", { name: "予約する" }).click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  const slots = page.getByRole("button", { name: new RegExp(`${DOCTOR.name} を予約する$`) });
  await expect(slots.first()).toBeVisible();
  const label = (await slots.last().getAttribute("aria-label"))!;
  const [, date, time] = label.match(/^(\S+) (\S+) /)!;
  await slots.last().click();
  await expect(page).toHaveURL(/\/appointments$/);
  const row = page
    .getByRole("row")
    .filter({ hasText: date! })
    .filter({ hasText: time! })
    .filter({ hasText: DOCTOR.name })
    .filter({ hasText: "予約済" });

  // 必須の質問を空のまま提出すると、悪い所が、質問ごとに、まとめて出る
  await row.getByRole("link", { name: "問診に答える" }).click();
  await expect(page.getByRole("heading", { name: "問診" })).toBeVisible();
  await page.getByRole("button", { name: "提出する" }).click();
  await expect(page.getByText("今日は、どのような症状でお困りですか: 答えを入れてください")).toBeVisible();
  await expect(page.getByText("症状は、いつからですか: 答えを入れてください")).toBeVisible();

  // 途中まで保存して、開き直しても、残っている
  await page.getByLabel("今日は、どのような症状でお困りですか").fill("のどが痛くて、声が出にくい");
  await page.getByText("せき", { exact: true }).click();
  await page.getByRole("button", { name: "途中まで保存する" }).click();
  await expect(page.getByText("途中まで保存しました")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("今日は、どのような症状でお困りですか")).toHaveValue(
    "のどが痛くて、声が出にくい",
  );
  await expect(page.getByRole("checkbox", { name: "せき" })).toBeChecked();

  // 続きを書いて、提出する
  await page.getByLabel("症状は、いつからですか").selectOption("2〜3日前");
  await page.getByRole("button", { name: "提出する" }).click();
  await expect(page.getByText("問診を提出しました")).toBeVisible();
  await expect(page).toHaveURL(/\/appointments$/);
  await expect(row.getByRole("link", { name: "問診を直す" })).toBeVisible();
  await logout(page);

  // 担当の医師は、答えを読める（直せない）
  await login(page, "/staff/login", DOCTOR.email);
  await row.getByRole("link", { name: "問診を見る" }).click();
  await expect(page.getByText("提出済")).toBeVisible();
  await expect(page.getByText("のどが痛くて、声が出にくい")).toBeVisible();
  await expect(page.getByText("2〜3日前")).toBeVisible();
  await expect(page.getByRole("button", { name: /提出する/ })).toHaveCount(0);
  const questionnaireUrl = page.url();
  await logout(page);

  // 事務スタッフには、予約は見えるが、問診への入口がない。URL を直接開いても、見えない
  await login(page, "/staff/login", CLERK.email);
  await page.getByLabel("状態").selectOption({ label: "予約済" });
  await expect(row).toHaveCount(1);
  await expect(row.getByRole("link", { name: /問診/ })).toHaveCount(0);
  await page.goto(questionnaireUrl);
  await expect(page.getByText("問診が見つかりません")).toBeVisible();
  await expect(page.getByText("のどが痛くて、声が出にくい")).toHaveCount(0);
});
