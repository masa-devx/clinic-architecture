import { expect, test } from "@playwright/test";
import { CLERK, CLERK_URL, DOCTOR, DOCTOR_URL, PATIENT, PATIENT_URL } from "./seed";
import { cancelLeftovers, graphql, login, tokyo } from "./helpers";

test("患者が問診に答え、担当の医師が読む。事務スタッフには見えない", async ({ page }) => {
  await login(page, PATIENT_URL, PATIENT.email);
  await cancelLeftovers(page);

  // 準備: 佐藤医師の、数日先の枠を、GraphQL で予約する（予約の画面は、ほかのテストで確かめている）
  const clinics = await graphql(
    page,
    PATIENT_URL,
    `
      {
        clinics {
          id
          name
        }
      }
    `,
  );
  const clinicId = clinics.clinics.find(
    (clinic: { name: string }) => clinic.name === "さくら内科クリニック",
  ).id;
  const slots = await graphql(
    page,
    PATIENT_URL,
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
    { clinicId },
  );
  const slot = slots.availableSlots.edges
    .map((edge: { node: unknown }) => edge.node)
    .filter((node: { doctor: { name: string } }) => node.doctor.name === DOCTOR.name)
    .at(-1);
  const booked = await graphql(
    page,
    PATIENT_URL,
    `
      mutation ($id: ID!) {
        bookAppointment(slotId: $id) {
          appointment {
            id
          }
          errors {
            code
          }
        }
      }
    `,
    {
      id: slot.id,
    },
  );
  const appointmentId = booked.bookAppointment.appointment.id;
  const when = tokyo(new Date(slot.startsAt));

  // 必須の質問を空のまま提出すると、悪い所が、質問ごとに、まとめて出る
  await page.goto(`${PATIENT_URL}/appointments`);
  const card = page
    .getByRole("article", { name: new RegExp(` ${when.time} ${DOCTOR.name} の予約$`) })
    .filter({ hasText: "予約済" });
  await card.getByRole("link", { name: "問診に答える" }).click();
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
  await expect(card.getByRole("link", { name: "問診を直す" })).toBeVisible();

  // 担当の医師は、その日の予定から、答えを読める（直せない）
  await login(page, DOCTOR_URL, DOCTOR.email);
  await page.goto(`${DOCTOR_URL}/appointments?date=${when.date}`);
  const item = page.getByRole("article", { name: `${when.time} ${PATIENT.name}` });
  await expect(item).toContainText("問診：提出済");
  await item.getByRole("link", { name: "問診を見る" }).click();
  await expect(page.getByText("のどが痛くて、声が出にくい")).toBeVisible();
  await expect(page.getByText("2〜3日前")).toBeVisible();
  await expect(page.getByRole("button", { name: /提出する/ })).toHaveCount(0);

  // 事務スタッフには、予約は見えるが、問診は見えない（答えも質問も null と空）
  await login(page, CLERK_URL, CLERK.email);
  const seen = await graphql(
    page,
    CLERK_URL,
    `
      query ($id: ID!) {
        appointment(id: $id) {
          id
          questionnaire {
            id
          }
          questionnaireQuestions {
            id
          }
        }
      }
    `,
    { id: appointmentId },
  );
  expect(seen.appointment).toEqual({ id: appointmentId, questionnaire: null, questionnaireQuestions: [] });
});
