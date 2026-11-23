import { renderWithProviders } from "@clinic/web-kit/test/render";
import { server } from "@clinic/web-kit/test/server";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchedulePage } from "@/features/appointments/components/SchedulePage";

// テストする所: 医師の、1日の診察の予定

// 画面の移動（Next.js の router）と知らせ（トースト）だけを差し替える。通信は MSW が受ける
const router = { push: vi.fn(), replace: vi.fn() };
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(search),
}));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@clinic/ui/toaster", () => ({ notifySuccess: notify.success, notifyError: notify.error }));

const api = graphql.link("http://localhost/graphql");
const PAGINATED = { appointments: ["filter", "descending"] };

type Status = "BOOKED" | "CHECKED_IN" | "IN_CONSULTATION" | "COMPLETED" | "CANCELED";
function appointment(
  id: string,
  time: string,
  name: string,
  status: Status,
  submitted: boolean | null = null,
) {
  return {
    __typename: "Appointment",
    id,
    status,
    // 何ができるかは、サーバーが決めて返す。ここでは状態に合わせて返す
    canStartConsultation: status === "CHECKED_IN",
    canFinishConsultation: status === "IN_CONSULTATION",
    canViewQuestionnaire: submitted !== null,
    questionnaire: submitted === null ? null : { __typename: "Questionnaire", id: `q${id}`, submitted },
    patient: { __typename: "Patient", id: `p${id}`, name },
    slot: {
      __typename: "Slot",
      id: `s${id}`,
      startsAt: `2030-01-07T${time}:00+09:00`,
      endsAt: `2030-01-07T${time.replace(":00", ":30")}:00+09:00`,
    },
  };
}
function schedule(appointments: ReturnType<typeof appointment>[]) {
  return HttpResponse.json<{ data: Record<string, unknown> }>({
    data: {
      appointments: {
        __typename: "AppointmentConnection",
        edges: appointments.map((node) => ({ __typename: "AppointmentEdge", node })),
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
      },
    },
  });
}
function payload(
  name: "startConsultation" | "finishConsultation",
  result: ReturnType<typeof appointment> | null,
  errors: { code: string; message: string; field: string | null }[] = [],
) {
  const typename = name === "startConsultation" ? "StartConsultationPayload" : "FinishConsultationPayload";
  return HttpResponse.json<{ data: Record<string, unknown> }>({
    data: {
      [name]: {
        __typename: typename,
        appointment: result,
        errors: errors.map((error) => ({ __typename: "UserError", ...error })),
      },
    },
  });
}

const booked = appointment("1", "09:00", "山田 花子", "BOOKED", false);
const checkedIn = appointment("2", "09:30", "鈴木 次郎", "CHECKED_IN", true);
const another = appointment("3", "10:00", "田中 三郎", "CHECKED_IN");
const canceled = appointment("4", "10:30", "高橋 四郎", "CANCELED");
const inConsultation = {
  ...checkedIn,
  status: "IN_CONSULTATION" as const,
  canStartConsultation: false,
  canFinishConsultation: true,
};

beforeEach(() => {
  search = "date=2030-01-07";
  router.replace.mockClear();
  notify.success.mockClear();
  notify.error.mockClear();
});

describe("正常系", () => {
  it("その日の予定を出す。キャンセルした予約は出さない", async () => {
    const asked: unknown[] = [];
    server.use(
      api.query("Schedule", ({ variables }) => {
        asked.push(variables.filter);
        return schedule([booked, checkedIn, canceled]);
      }),
    );
    renderWithProviders(<SchedulePage />, PAGINATED);

    expect(await screen.findByRole("article", { name: "09:00 山田 花子" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "09:30 鈴木 次郎" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "10:30 高橋 四郎" })).not.toBeInTheDocument();
    expect(screen.getByText("2 件")).toBeInTheDocument();
    // URL の日付で、その日だけを取りに行く
    expect(asked[0]).toEqual({ from: "2030-01-07", to: "2030-01-07" });
  });

  it("出すボタンは、サーバーが返す can〜 で決まる", async () => {
    server.use(api.query("Schedule", () => schedule([booked, checkedIn])));
    renderWithProviders(<SchedulePage />, PAGINATED);

    // 予約済（まだ受付していない）は、診察を始められない。問診は途中までなので、見るリンクは出る
    const first = await screen.findByRole("article", { name: "09:00 山田 花子" });
    expect(within(first).queryByRole("button", { name: "診察を始める" })).not.toBeInTheDocument();
    expect(within(first).getByText("問診：途中まで（未提出）")).toBeInTheDocument();
    // 受付済は、診察を始められる。問診を見るリンクは、その予約の画面へ
    const second = screen.getByRole("article", { name: "09:30 鈴木 次郎" });
    expect(within(second).getByRole("button", { name: "診察を始める" })).toBeEnabled();
    expect(within(second).getByRole("link", { name: "問診を見る" })).toHaveAttribute(
      "href",
      "/appointments/2",
    );
  });

  it("診察を始めると、返ってきた予約で画面が変わる。送っているあいだは、ほかの予約のボタンを押せない", async () => {
    let requests = 0;
    let release = () => {};
    const waiting = new Promise<void>((resolve) => (release = resolve));
    server.use(
      api.query("Schedule", () => schedule([checkedIn, another])),
      api.mutation("StartConsultation", async () => {
        requests += 1;
        await waiting;
        return payload("startConsultation", {
          ...checkedIn,
          status: "IN_CONSULTATION",
          canStartConsultation: false,
          canFinishConsultation: true,
        });
      }),
    );
    renderWithProviders(<SchedulePage />, PAGINATED);

    const item = await screen.findByRole("article", { name: "09:30 鈴木 次郎" });
    await userEvent.click(within(item).getByRole("button", { name: "診察を始める" }));
    const other = screen.getByRole("article", { name: "10:00 田中 三郎" });
    expect(within(other).getByRole("button", { name: "診察を始める" })).toBeDisabled();

    release();
    // 取り直さなくても、同じ id の予約がキャッシュで新しくなり、「診察を終える」に変わる
    expect(await within(item).findByRole("button", { name: "診察を終える" })).toBeInTheDocument();
    expect(within(item).getByText("診察中")).toBeInTheDocument();
    expect(within(other).getByRole("button", { name: "診察を始める" })).toBeEnabled();
    expect(notify.success).toHaveBeenCalledWith("診察を始めました");
    expect(requests).toBe(1);
  });

  it("診察を終えるときは、確認の窓を出してから送る", async () => {
    const sent: string[] = [];
    server.use(
      api.query("Schedule", () => schedule([inConsultation])),
      api.mutation("FinishConsultation", ({ variables }) => {
        sent.push(variables.appointmentId);
        return payload("finishConsultation", {
          ...inConsultation,
          status: "COMPLETED",
          canFinishConsultation: false,
        });
      }),
    );
    renderWithProviders(<SchedulePage />, PAGINATED);

    const item = await screen.findByRole("article", { name: "09:30 鈴木 次郎" });
    await userEvent.click(within(item).getByRole("button", { name: "診察を終える" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(sent).toEqual([]);
    await userEvent.click(within(dialog).getByRole("button", { name: "診察を終える" }));

    await waitFor(() =>
      expect(notify.success).toHaveBeenCalledWith("診察を終えました。会計は事務スタッフに回ります"),
    );
    expect(sent).toEqual(["2"]);
  });

  it("前の日・次の日へは、URL の日付を変えて移る", async () => {
    server.use(api.query("Schedule", () => schedule([])));
    renderWithProviders(<SchedulePage />, PAGINATED);

    await userEvent.click(await screen.findByRole("button", { name: "次の日" }));
    expect(router.replace).toHaveBeenLastCalledWith("/?date=2030-01-08", { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: "前の日" }));
    expect(router.replace).toHaveBeenLastCalledWith("/?date=2030-01-06", { scroll: false });
  });
});

describe("異常系", () => {
  it("断られたら、理由を知らせ、予定を取り直す", async () => {
    let reads = 0;
    server.use(
      api.query("Schedule", () => {
        reads += 1;
        // 取り直すと、ほかの所でキャンセルされていたことが分かる
        return schedule(
          reads === 1 ? [checkedIn] : [{ ...checkedIn, status: "CANCELED", canStartConsultation: false }],
        );
      }),
      api.mutation("StartConsultation", () =>
        payload("startConsultation", null, [
          { code: "INVALID_TRANSITION", message: "この予約は、診察を始められません", field: null },
        ]),
      ),
    );
    renderWithProviders(<SchedulePage />, PAGINATED);

    const item = await screen.findByRole("article", { name: "09:30 鈴木 次郎" });
    await userEvent.click(within(item).getByRole("button", { name: "診察を始める" }));

    await waitFor(() => expect(notify.error).toHaveBeenCalledWith("この予約は、診察を始められません"));
    expect(await screen.findByText("この日の診察の予定は、ありません")).toBeInTheDocument();
    expect(reads).toBe(2);
  });

  it("URL の日付が正しくなければ、今日の予定を出す", async () => {
    search = "date=2030-02-31";
    const asked: { from: string }[] = [];
    server.use(
      api.query("Schedule", ({ variables }) => {
        asked.push(variables.filter);
        return schedule([]);
      }),
    );
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2030-03-10T15:30:00Z")); // 日本時間では 3/11 の 0:30
    try {
      renderWithProviders(<SchedulePage />, PAGINATED);
      expect(await screen.findByText("この日の診察の予定は、ありません")).toBeInTheDocument();
      expect(asked[0]?.from).toBe("2030-03-11");
      // 今日を見ているときは、「今日」へ戻るボタンを出さない
      expect(screen.queryByRole("button", { name: "今日" })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
