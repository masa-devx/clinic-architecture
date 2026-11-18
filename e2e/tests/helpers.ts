import { expect, type Page } from "@playwright/test";
import { PASSWORD, PATIENT_URL } from "./seed";

// その画面（baseUrl）に、ログインする。3つの画面は、ログインが別々
export async function login(page: Page, baseUrl: string, email: string) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
}

// その画面の GraphQL を、ログインしている人として直接呼ぶ（テストのデータを作る・片付けるため）
export async function graphql<Data = Record<string, any>>(
  page: Page,
  baseUrl: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<Data> {
  const response = await page.request.post(`${baseUrl}/graphql`, { data: { query, variables } });
  const body = await response.json();
  expect(body.errors, JSON.stringify(body.errors)).toBeUndefined();
  return body.data;
}

// 前の実行やほかのテストが残した予約を、片付ける（患者の画面にログインしている患者の「予約済」を、全部キャンセルする）
export async function cancelLeftovers(page: Page) {
  const data = await graphql(
    page,
    PATIENT_URL,
    `
      {
        appointments(filter: { status: BOOKED }, first: 50) {
          edges {
            node {
              id
            }
          }
        }
      }
    `,
  );
  for (const edge of data.appointments.edges) {
    await graphql(
      page,
      PATIENT_URL,
      `
        mutation ($id: ID!) {
          cancelAppointment(appointmentId: $id) {
            errors {
              code
            }
          }
        }
      `,
      {
        id: edge.node.id,
      },
    );
  }
}

// 確認の窓の、実行するボタンを押す
export async function confirm(page: Page, label: string) {
  await page.getByRole("alertdialog").getByRole("button", { name: label }).click();
}

// 日本時間の、日付（YYYY-MM-DD）と時刻（HH:MM）
export function tokyo(at: Date) {
  const iso = new Date(at.getTime() + 9 * 3_600_000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}
