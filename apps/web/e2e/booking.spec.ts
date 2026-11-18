import { expect, test, type Page } from "@playwright/test";
import { CLERK, DOCTOR, OTHER_CLINIC_CLERK, PASSWORD, PATIENT } from "./seed";

async function login(page: Page, path: "/login" | "/staff/login", email: string) {
  await page.goto(path);
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();
}

// 前の実行が途中で落ちて残った予約を、片付ける（ログインしている患者の「予約済」を、全部キャンセルする）。
// テストが、前の実行の結果に左右されないようにするため
async function cancelLeftovers(page: Page) {
  const post = async (query: string, variables: Record<string, unknown> = {}) => {
    const response = await page.request.post("/graphql", { data: { query, variables } });
    return (await response.json()).data;
  };
  const data = await post(
    `{ appointments(filter: { status: BOOKED }, first: 50) { edges { node { id } } } }`,
  );
  for (const edge of data.appointments.edges) {
    await post(`mutation($id: ID!) { cancelAppointment(appointmentId: $id) { errors { code } } }`, {
      id: edge.node.id,
    });
  }
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
}

test("患者が予約し、事務スタッフの一覧に出て、患者がキャンセルする", async ({ page }) => {
  // 患者がログインして、空いている枠を1つ予約する
  await login(page, "/login", PATIENT.email);
  await expect(page.getByRole("heading", { name: "自分の予約" })).toBeVisible();
  await cancelLeftovers(page);

  await page.getByRole("link", { name: "予約する" }).click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  await expect(page.getByRole("heading", { name: "さくら内科クリニック" })).toBeVisible();

  // 最初のページの、最後に出ている枠を予約する（数日先の枠）。最初の枠は、走らせる時刻によっては
  // 開始まで1時間を切っていて、患者がキャンセルできないため。
  // どの枠かは、ボタンの名前（日付・時刻・医師）から控えておく
  await expect(page.getByRole("button", { name: /を予約する$/ }).first()).toBeVisible();
  const targetSlot = page.getByRole("button", { name: /を予約する$/ }).last();
  const slotName = (await targetSlot.getAttribute("aria-label"))!;
  const [, date, time, doctor] = slotName.match(/^(\S+) (\S+) (.+) を予約する$/)!;
  await targetSlot.click();

  // 自分の予約の画面へ移り、予約した枠が「予約済」で出る
  await expect(page).toHaveURL(/\/appointments$/);
  // 同じ枠の、前にキャンセルした予約の行もあるので、「予約済」の行に絞る（1つの枠に、予約済は1件だけ）
  const slotRows = page
    .getByRole("row")
    .filter({ hasText: date! })
    .filter({ hasText: time! })
    .filter({ hasText: doctor! });
  const bookedRow = slotRows.filter({ hasText: "予約済" });
  await expect(bookedRow).toHaveCount(1);
  await expect(bookedRow).toContainText("さくら内科クリニック");

  // 予約した枠は、空いている枠の一覧から消えている
  await page.getByRole("link", { name: "予約する" }).click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  await expect(page.getByRole("button", { name: /を予約する$/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: slotName })).toHaveCount(0);
  await logout(page);

  // 同じ医療機関の事務スタッフの一覧に、患者の名前つきで出る
  await login(page, "/staff/login", CLERK.email);
  await expect(page.getByRole("heading", { name: "予約の一覧" })).toBeVisible();
  await page.getByLabel("状態").selectOption({ label: "予約済" });
  await expect(bookedRow).toHaveCount(1);
  await expect(bookedRow).toContainText(PATIENT.name);
  await logout(page);

  // ほかの医療機関の事務スタッフの一覧には出ない
  await login(page, "/staff/login", OTHER_CLINIC_CLERK.email);
  await expect(page.getByRole("heading", { name: "予約の一覧" })).toBeVisible();
  await expect(page.getByText(OTHER_CLINIC_CLERK.clinic)).toBeVisible();
  await expect(page.getByText("条件に合う予約はありません").or(page.getByRole("table"))).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: PATIENT.name })).toHaveCount(0);
  await logout(page);

  // 患者がキャンセルすると「キャンセル」になり、枠はもう一度予約できるようになる
  await login(page, "/login", PATIENT.email);
  page.once("dialog", (dialog) => dialog.accept());
  await bookedRow.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByText("予約をキャンセルしました")).toBeVisible();
  await expect(bookedRow).toHaveCount(0);
  // キャンセルした行には、もうキャンセルのボタンがない
  await expect(slotRows.getByRole("button", { name: "キャンセル" })).toHaveCount(0);

  await page.getByRole("link", { name: "予約する" }).click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  await expect(page.getByRole("button", { name: slotName })).toBeVisible();
});

test("ログインしていなければ、どの画面もログインへ送られる。患者は、スタッフの画面に入れない", async ({
  page,
}) => {
  await page.goto("/appointments");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/staff/appointments");
  await expect(page).toHaveURL(/\/staff\/login$/);

  await login(page, "/login", PATIENT.email);
  await expect(page.getByRole("heading", { name: "自分の予約" })).toBeVisible();
  await page.goto("/staff/appointments");
  await expect(page).toHaveURL(/\/staff\/login$/);
});

test("パスワードが違うと、ログインできず、理由が出る", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill(PATIENT.email);
  await page.getByLabel("パスワード").fill("ちがうパスワード");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page.getByText("メールアドレスかパスワードが違います")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("スタッフの一覧の絞り込みは URL に残り、リロードしても消えない", async ({ page }) => {
  await login(page, "/staff/login", CLERK.email);
  await expect(page.getByRole("heading", { name: "予約の一覧" })).toBeVisible();

  await page.getByLabel("状態").selectOption({ label: "キャンセル" });
  await expect(page).toHaveURL(/status=CANCELED/);

  await page.reload();
  await expect(page.getByLabel("状態")).toHaveValue("CANCELED");
  // 読み込みが終わってから（表か、空の知らせが出てから）、表の中に「予約済」の行がないことを確かめる
  await expect(page.getByText("条件に合う予約はありません").or(page.getByRole("table"))).toBeVisible();
  await expect(page.getByRole("cell", { name: "予約済", exact: true })).toHaveCount(0);
});

test("医師が、自分の診療枠をまとめて作れる", async ({ page }) => {
  await login(page, "/staff/login", DOCTOR.email);
  await page.getByRole("link", { name: "診療枠を作る" }).click();

  // 医師の欄に出るのは、自分だけ（ほかの医師は選べない）
  await expect(page.getByLabel("医師").getByRole("option")).toHaveText([DOCTOR.name]);
  await page.getByRole("button", { name: "診療枠を作る" }).click();

  // 初期データと同じ時間帯なので、何度走らせても、すでにある枠は飛ばされる（エラーにはならない）
  await expect(page.getByRole("status").filter({ hasText: "枠を作りました" })).toBeVisible();
});

// 空いている枠の、最初のページの後ろから n 番目（0 が最後）のボタンと、その名前（日付・時刻・医師）
async function slotFromEnd(page: Page, n: number, suffix: RegExp) {
  const buttons = page.getByRole("button", { name: suffix });
  await expect(buttons.first()).toBeVisible();
  const button = buttons.nth((await buttons.count()) - 1 - n);
  const label = (await button.getAttribute("aria-label"))!;
  const [, date, time, doctor] = label.match(/^(\S+) (\S+) (\S+ \S+) を/)!;
  return { button, date: date!, time: time!, doctor: doctor! };
}

test("患者が、予約の時刻を変える", async ({ page }) => {
  await login(page, "/login", PATIENT.email);
  await expect(page.getByRole("heading", { name: "自分の予約" })).toBeVisible();
  await cancelLeftovers(page);

  await page.getByRole("link", { name: "予約する" }).click();
  await page.getByRole("link", { name: "さくら内科クリニック" }).click();
  const before = await slotFromEnd(page, 0, /を予約する$/);
  await before.button.click();
  await expect(page).toHaveURL(/\/appointments$/);
  const rowOf = (slot: { date: string; time: string; doctor: string }) =>
    page
      .getByRole("row")
      .filter({ hasText: slot.date })
      .filter({ hasText: slot.time })
      .filter({ hasText: slot.doctor })
      .filter({ hasText: "予約済" });
  await expect(rowOf(before)).toHaveCount(1);

  // 「時刻を変える」から、別の枠を選ぶ
  await rowOf(before).getByRole("link", { name: "時刻を変える" }).click();
  await expect(page.getByText("予約の時刻を変えます")).toBeVisible();
  const after = await slotFromEnd(page, 3, /この時刻に変える/);
  await after.button.click();

  // 予約は1件のまま、新しい枠に変わる。前の枠の行は、なくなる
  await expect(page).toHaveURL(/\/appointments$/);
  await expect(rowOf(after)).toHaveCount(1);
  await expect(rowOf(before)).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "予約済", exact: true })).toHaveCount(1);
});

test("事務スタッフが、患者の代わりに予約を入れ、枠を閉じる", async ({ page }) => {
  await login(page, "/staff/login", CLERK.email);
  await page.getByRole("link", { name: "空いている枠" }).click();

  // メールアドレスを入れずに押すと、送らずに止める
  const target = await slotFromEnd(page, 1, /を選ぶ（代わりに予約する）$/);
  await target.button.click();
  await expect(page.getByText("患者のメールアドレスを入れてください")).toBeVisible();

  // 登録のないメールアドレスは、断られる
  await page.getByLabel("代わりに予約を入れる患者のメールアドレス").fill("nobody@example.com");
  await target.button.click();
  await expect(page.getByText("このメールアドレスの患者が見つかりません")).toBeVisible();

  await page.getByLabel("代わりに予約を入れる患者のメールアドレス").fill(PATIENT.email);
  const again = await slotFromEnd(page, 1, /を選ぶ（代わりに予約する）$/);
  await again.button.click();
  await expect(page.getByText("予約しました")).toBeVisible();

  // 空いている枠を1つ閉じると、一覧から消える
  const closing = await slotFromEnd(page, 0, /を閉じる$/);
  const closingName = (await closing.button.getAttribute("aria-label"))!;
  page.once("dialog", (dialog) => dialog.accept());
  await closing.button.click();
  await expect(page.getByText("枠を閉じました")).toBeVisible();
  await expect(page.getByRole("button", { name: closingName })).toHaveCount(0);

  // 予約の一覧に、「代理」の印つきで出る。あとの実行に残さないように、キャンセルしておく
  await page.getByRole("link", { name: "予約の一覧" }).click();
  await page.getByLabel("状態").selectOption({ label: "予約済" });
  const row = page
    .getByRole("row")
    .filter({ hasText: PATIENT.name })
    .filter({ hasText: again.date })
    .filter({ hasText: again.time })
    .filter({ hasText: again.doctor })
    .filter({ hasText: "（代理）" });
  await expect(row).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByText("予約をキャンセルしました")).toBeVisible();
});
