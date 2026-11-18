import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import { SlotPicker } from "./SlotPicker";

// 画面の移動（Next.js の router）だけを差し替える。通信は MSW が受ける
const router = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/book/1",
  useSearchParams: () => new URLSearchParams(""),
}));

const api = graphql.link("http://localhost/graphql");

const doctor = { __typename: "Doctor", id: "10", name: "佐藤 一郎" };
function slot(id: string, startsAt: string) {
  return {
    __typename: "Slot",
    id,
    startsAt,
    endsAt: startsAt.replace(":00:00", ":30:00"),
    canClose: false,
    doctor,
  };
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

const nine = slot("101", "2030-01-07T09:00:00+09:00");
const ten = slot("102", "2030-01-07T10:00:00+09:00");

describe("空いている枠から予約する", () => {
  beforeEach(() => {
    router.push.mockClear();
  });

  it("枠を選んで予約できたら、自分の予約の画面へ移る", async () => {
    const booked: string[] = [];
    server.use(
      api.query("AvailableSlots", () => availableSlots([nine, ten])),
      api.mutation("BookAppointment", ({ variables }) => {
        booked.push(variables.slotId);
        return HttpResponse.json({
          data: {
            bookAppointment: {
              __typename: "BookAppointmentPayload",
              appointment: { __typename: "Appointment", id: "500", status: "BOOKED" },
              errors: [],
            },
          },
        });
      }),
    );
    const { failures } = renderWithProviders(
      <SlotPicker clinicId="1" mode="patient" donePath="/appointments" />,
    );

    expect(await screen.findByRole("heading", { name: "さくら内科クリニック" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "1/7(月) 10:00 佐藤 一郎 を予約する" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/appointments"));
    expect(booked).toEqual(["102"]);
    expect(failures).toEqual([]);
  });

  it("先にほかの人が予約していたら、「すでに埋まっています」と出し、埋まった枠を一覧から消す", async () => {
    let taken = false;
    server.use(
      // 予約に失敗したあとの取り直しでは、埋まった枠が消えた一覧を返す
      api.query("AvailableSlots", () => availableSlots(taken ? [ten] : [nine, ten])),
      api.mutation("BookAppointment", () => {
        taken = true;
        return HttpResponse.json({
          data: {
            bookAppointment: {
              __typename: "BookAppointmentPayload",
              appointment: null,
              errors: [
                {
                  __typename: "UserError",
                  code: "SLOT_TAKEN",
                  message: "すでに埋まっています。ほかの枠を選んでください",
                  field: "slotId",
                },
              ],
            },
          },
        });
      }),
    );
    renderWithProviders(<SlotPicker clinicId="1" mode="patient" donePath="/appointments" />);

    await userEvent.click(await screen.findByRole("button", { name: "1/7(月) 09:00 佐藤 一郎 を予約する" }));

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("すでに埋まっています。ほかの枠を選んでください")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "1/7(月) 09:00 佐藤 一郎 を予約する" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "1/7(月) 10:00 佐藤 一郎 を予約する" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("予約を送っているあいだは、どの枠のボタンも押せない（2回送らない）", async () => {
    let requests = 0;
    let release = () => {};
    const waiting = new Promise<void>((resolve) => (release = resolve));
    server.use(
      api.query("AvailableSlots", () => availableSlots([nine, ten])),
      api.mutation("BookAppointment", async () => {
        requests += 1;
        await waiting;
        return HttpResponse.json({
          data: {
            bookAppointment: {
              __typename: "BookAppointmentPayload",
              appointment: { __typename: "Appointment", id: "500", status: "BOOKED" },
              errors: [],
            },
          },
        });
      }),
    );
    renderWithProviders(<SlotPicker clinicId="1" mode="patient" donePath="/appointments" />);

    await userEvent.click(await screen.findByRole("button", { name: "1/7(月) 09:00 佐藤 一郎 を予約する" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "1/7(月) 10:00 佐藤 一郎 を予約する" })).toBeDisabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: "1/7(月) 10:00 佐藤 一郎 を予約する" }));
    release();

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/appointments"));
    expect(requests).toBe(1);
  });

  it("枠が1つもなければ、空いていないことを伝える", async () => {
    server.use(api.query("AvailableSlots", () => availableSlots([])));
    renderWithProviders(<SlotPicker clinicId="1" mode="patient" donePath="/appointments" />);

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
    const { failures } = renderWithProviders(
      <SlotPicker clinicId="1" mode="patient" donePath="/appointments" />,
    );

    expect(await screen.findByText("空いている枠を読み込めませんでした")).toBeInTheDocument();
    expect(failures).toEqual(["UNAUTHENTICATED"]);
  });
});
