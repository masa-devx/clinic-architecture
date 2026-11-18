import { renderWithProviders } from "@clinic/web-kit/test/render";
import { server } from "@clinic/web-kit/test/server";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SlotPicker } from "./SlotPicker";

// 画面の移動（Next.js の router）だけを差し替える。通信は MSW が受ける
const router = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/book/1",
  useSearchParams: () => new URLSearchParams(""),
}));

const api = graphql.link("http://localhost/graphql");
const PAGINATED = { availableSlots: ["clinicId", "doctorId", "from", "to"] };

const doctor = { __typename: "Doctor", id: "10", name: "佐藤 一郎" };
function slot(id: string, startsAt: string) {
  return { __typename: "Slot", id, startsAt, endsAt: startsAt.replace(":00:00", ":30:00"), doctor };
}
function availableSlots(slots: ReturnType<typeof slot>[]) {
  return HttpResponse.json<{ data: Record<string, unknown> }>({
    data: {
      clinic: { __typename: "Clinic", id: "1", name: "さくら内科クリニック", doctors: [doctor] },
      availableSlots: {
        __typename: "SlotConnection",
        edges: slots.map((node) => ({ __typename: "SlotEdge", node })),
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  });
}
function booked(errors: { code: string; message: string; field: string }[] = []) {
  return HttpResponse.json<{ data: Record<string, unknown> }>({
    data: {
      bookAppointment: {
        __typename: "BookAppointmentPayload",
        appointment: errors.length ? null : { __typename: "Appointment", id: "500", status: "BOOKED" },
        errors: errors.map((error) => ({ __typename: "UserError", ...error })),
      },
    },
  });
}

const nine = slot("101", "2030-01-07T09:00:00+09:00");
const ten = slot("102", "2030-01-07T10:00:00+09:00");

// 時刻のボタンを押して、確認の窓の「予約する」を押す
async function book(time: string) {
  await userEvent.click(await screen.findByRole("button", { name: `1/7(月) ${time} 佐藤 一郎 を予約する` }));
  const dialog = await screen.findByRole("alertdialog");
  expect(within(dialog).getByText(`1/7(月) ${time}〜`, { exact: false })).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole("button", { name: "予約する" }));
}

describe("空いている枠から予約する", () => {
  beforeEach(() => {
    router.push.mockClear();
  });

  it("時刻を押すと、確認の窓が出る。やめると、何も送らない", async () => {
    const sent: string[] = [];
    server.use(
      api.query("AvailableSlots", () => availableSlots([nine, ten])),
      api.mutation("BookAppointment", ({ variables }) => {
        sent.push(variables.slotId);
        return booked();
      }),
    );
    renderWithProviders(<SlotPicker clinicId="1" />, PAGINATED);

    await userEvent.click(await screen.findByRole("button", { name: "1/7(月) 10:00 佐藤 一郎 を予約する" }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "やめる" }));

    // 閉じる動き（アニメーション）は、テストの環境では終わらないので、窓が「閉じた」状態になったことで確かめる
    await waitFor(() => expect(dialog).toHaveAttribute("data-state", "closed"));
    expect(sent).toEqual([]);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("確認して予約できたら、自分の予約の画面へ移る", async () => {
    const sent: string[] = [];
    server.use(
      api.query("AvailableSlots", () => availableSlots([nine, ten])),
      api.mutation("BookAppointment", ({ variables }) => {
        sent.push(variables.slotId);
        return booked();
      }),
    );
    const { failures } = renderWithProviders(<SlotPicker clinicId="1" />, PAGINATED);

    await book("10:00");

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/appointments"));
    expect(sent).toEqual(["102"]);
    expect(failures).toEqual([]);
  });

  it("先にほかの人が予約していたら、「すでに埋まっています」と出し、埋まった枠を一覧から消す", async () => {
    let taken = false;
    server.use(
      // 予約に失敗したあとの取り直しでは、埋まった枠が消えた一覧を返す
      api.query("AvailableSlots", () => availableSlots(taken ? [ten] : [nine, ten])),
      api.mutation("BookAppointment", () => {
        taken = true;
        return booked([
          { code: "SLOT_TAKEN", message: "すでに埋まっています。ほかの枠を選んでください", field: "slotId" },
        ]);
      }),
    );
    renderWithProviders(<SlotPicker clinicId="1" />, PAGINATED);

    await book("09:00");

    expect(await screen.findByText("すでに埋まっています。ほかの枠を選んでください")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "1/7(月) 09:00 佐藤 一郎 を予約する" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "1/7(月) 10:00 佐藤 一郎 を予約する" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("枠が1つもなければ、空いていないことを伝える", async () => {
    server.use(api.query("AvailableSlots", () => availableSlots([])));
    renderWithProviders(<SlotPicker clinicId="1" />, PAGINATED);

    expect(await screen.findByText("空いている枠がありません")).toBeInTheDocument();
  });

  it("ログインが切れていたら、エラーを1か所（Apollo の設定）で受ける", async () => {
    server.use(
      api.query("AvailableSlots", () =>
        HttpResponse.json({
          data: null,
          errors: [{ message: "ログインしてください", extensions: { code: "UNAUTHENTICATED" } }],
        }),
      ),
    );
    const { failures } = renderWithProviders(<SlotPicker clinicId="1" />, PAGINATED);

    expect(await screen.findByText("空いている枠を読み込めませんでした")).toBeInTheDocument();
    expect(failures).toEqual(["UNAUTHENTICATED"]);
  });
});
