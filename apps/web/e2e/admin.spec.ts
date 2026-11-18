import { expect, test, type Page } from "@playwright/test";
import { CLERK, DOCTOR, OTHER_CLINIC_CLERK, PASSWORD, PATIENT } from "./seed";

async function login(page: Page, email: string) {
  await page.goto("/staff/login");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
}

// GraphQL を、ログインしている人として直接呼ぶ（テストのデータを作る・片付けるため）
async function graphql(page: Page, query: string, variables: Record<string, unknown> = {}) {
  return (await (await page.request.post("/graphql", { data: { query, variables } })).json()).data;
}

test("管理者の事務スタッフが、ダッシュボードと監査ログを見る", async ({ page }) => {
  await login(page, CLERK.email);

  // ほかのテストに頼らないように、ここで予約を1件作る（事務スタッフの代理の予約）。終わりにキャンセルして片付ける
  const me = await graphql(
    page,
    `
      {
        me {
          clinic {
            id
          }
        }
      }
    `,
  );
  const slots = await graphql(
    page,
    `
      query ($clinicId: ID!) {
        availableSlots(clinicId: $clinicId, first: 30) {
          edges {
            node {
              id
              startsAt
              doctor {
                name
              }
            }
          }
        }
      }
    `,
    { clinicId: me.me.clinic.id },
  );
  const slot = slots.availableSlots.edges.at(-1).node;
  const booked = await graphql(
    page,
    `
      mutation ($slotId: ID!, $email: String!) {
        bookAppointment(slotId: $slotId, patientEmail: $email) {
          appointment {
            id
          }
          errors {
            code
          }
        }
      }
    `,
    { slotId: slot.id, email: PATIENT.email },
  );
  expect(booked.bookAppointment.errors).toEqual([]);
  const appointmentId = booked.bookAppointment.appointment.id;
  // 枠の日（日本時間）
  const day = new Date(new Date(slot.startsAt).getTime() + 9 * 3_600_000).toISOString().slice(0, 10);

  // その日のダッシュボードに、その医師の行が出て、合計の行に割合と売上が出る
  await page.goto(`/staff/dashboard?from=${day}&to=${day}`);
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: slot.doctor.name }).first()).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "合計" })).toContainText("%");
  await expect(page.getByRole("row").filter({ hasText: "合計" })).toContainText("円");

  // 期間は URL に残る。32日にすると、集計せずに理由を出す
  await page.getByLabel("この日から").fill("2030-01-01");
  // 1つ目が URL に反映されてから、2つ目を入れる（人の操作と同じ順）
  await expect(page).toHaveURL(/from=2030-01-01/);
  await page.getByLabel("この日まで").fill("2030-02-01");
  await expect(page).toHaveURL(/from=2030-01-01&to=2030-02-01/);
  await expect(page.getByText("期間は、31日までにしてください")).toBeVisible();
  await page.getByLabel("この日まで").fill("2030-01-31");
  await expect(page.getByText("この期間の予約は、ありません")).toBeVisible();

  await page.getByRole("link", { name: "監査ログ" }).click();
  await expect(page.getByRole("heading", { name: "監査ログ" })).toBeVisible();
  // いちばん新しい行が、さっきの代理の予約（誰が・どの患者の・何を・どうした）
  const newest = page.getByRole("table").getByRole("row").nth(1);
  await expect(newest).toContainText(CLERK.name);
  await expect(newest).toContainText(PATIENT.name);
  await expect(newest).toContainText(`予約 #${appointmentId}`);
  await expect(newest).toContainText("予約した");

  await graphql(
    page,
    `
      mutation ($id: ID!) {
        cancelAppointment(appointmentId: $id) {
          errors {
            code
          }
        }
      }
    `,
    { id: appointmentId },
  );
});

test("管理者でない事務スタッフ・医師には、監査ログの入口がなく、URL を直接開いても出ない", async ({
  page,
}) => {
  await login(page, OTHER_CLINIC_CLERK.email);
  await expect(page.getByRole("link", { name: "ダッシュボード" })).toBeVisible();
  await expect(page.getByRole("link", { name: "監査ログ" })).toHaveCount(0);
  await page.goto("/staff/audit-logs");
  await expect(page.getByText("監査ログは、ありません")).toBeVisible();

  await page.getByRole("button", { name: "ログアウト" }).click();
  // ログアウトで画面が移り終わるのを待ってから、次のログインへ進む
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  await login(page, DOCTOR.email);
  await expect(page.getByRole("link", { name: "ダッシュボード" })).toHaveCount(0);
  await page.goto("/staff/dashboard");
  await expect(page.getByText("この期間の予約は、ありません")).toBeVisible();
});
