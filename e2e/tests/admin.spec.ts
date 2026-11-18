import { expect, test } from "@playwright/test";
import { CLERK, CLERK_URL, OTHER_CLINIC_CLERK, PATIENT } from "./seed";
import { graphql, login, logout, tokyo } from "./helpers";

test("管理者の事務スタッフが、ダッシュボードと監査ログを見る", async ({ page }) => {
  await login(page, CLERK_URL, CLERK.email);

  // ほかのテストに頼らないように、ここで予約を1件作る（代理の予約）。終わりにキャンセルして片付ける
  const slots = await graphql(
    page,
    CLERK_URL,
    `
      {
        availableSlots(first: 30) {
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
  );
  const slot = slots.availableSlots.edges.at(-1).node;
  const booked = await graphql(
    page,
    CLERK_URL,
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
  const day = tokyo(new Date(slot.startsAt)).date;

  // その日のダッシュボードに、合計のカードと、その医師の行が出る
  await page.goto(`${CLERK_URL}/dashboard?from=${day}&to=${day}`);
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
  await expect(page.getByText("キャンセルの割合").first()).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: slot.doctor.name }).first()).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "合計" })).toContainText("円");

  // 期間は URL に残る。32日にすると、集計せずに理由を出す
  await page.getByLabel("この日から").fill("2030-01-01");
  await expect(page).toHaveURL(/from=2030-01-01/);
  await page.getByLabel("この日まで").fill("2030-02-01");
  await expect(page.getByText("期間は、31日までにしてください")).toBeVisible();
  await page.getByLabel("この日まで").fill("2030-01-31");
  await expect(page.getByText("この期間の予約は、ありません")).toBeVisible();

  // 監査ログの、いちばん新しい行が、さっきの代理の予約（誰が・どの患者の・何を・どうした）
  await page.getByRole("link", { name: "監査ログ" }).click();
  const newest = page.getByRole("table").getByRole("row").nth(1);
  await expect(newest).toContainText(CLERK.name);
  await expect(newest).toContainText(PATIENT.name);
  await expect(newest).toContainText(`予約 #${appointmentId}`);
  await expect(newest).toContainText("予約した");

  await graphql(
    page,
    CLERK_URL,
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

test("管理者でない事務スタッフには、監査ログの入口がなく、URL を直接開いても出ない", async ({ page }) => {
  await login(page, CLERK_URL, OTHER_CLINIC_CLERK.email);
  await expect(page.getByRole("link", { name: "ダッシュボード" })).toBeVisible();
  await expect(page.getByRole("link", { name: "監査ログ" })).toHaveCount(0);
  await page.goto(`${CLERK_URL}/audit-logs`);
  await expect(page.getByText("監査ログは、ありません")).toBeVisible();
  await logout(page);
});
