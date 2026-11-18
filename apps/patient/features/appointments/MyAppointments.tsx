"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Button, Center, Stack, Tabs } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { notifyError, notifySuccess } from "@clinic/ui/toaster";
import { addDays, toDateInTokyo } from "@clinic/web-kit/datetime";
import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { AppointmentFilter } from "@/lib/gql/graphql";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentsDocument, CancelAppointmentDocument, CheckInDocument } from "./appointments.graphql";

type ListProps = {
  filter: AppointmentFilter;
  descending?: boolean;
  emptyTitle: string;
  showBookLink?: boolean;
};

// 予約の一覧を取って、カード（AppointmentCard）に渡す。続きの読み込みと、受付・キャンセルも、ここが持つ
function AppointmentCards({ filter, descending = false, emptyTitle, showBookLink = false }: ListProps) {
  const { data, loading, error, fetchMore, refetch } = useQuery(AppointmentsDocument, {
    variables: { filter, descending },
    // 開くたびに取り直す（医療機関の側の操作で変わるため）。取り直すあいだは、キャッシュの一覧を出しておく
    fetchPolicy: "cache-and-network",
  });
  const [cancelAppointment] = useMutation(CancelAppointmentDocument);
  const [checkIn] = useMutation(CheckInDocument);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // カードは、返ってきた予約（同じ id）でキャッシュが自動で新しくなる。一覧を取り直すのは、断られたときだけ
  const finish = async (userError: { message: string } | undefined, done: string) => {
    if (userError) {
      notifyError(userError.message);
      // 断られたのは、ほかの操作や時刻で、状態が変わっていたから。一覧を取り直して、今の状態を出す
      await refetch();
    } else {
      notifySuccess(done);
    }
  };

  const onCheckIn = async (appointmentId: string) => {
    setBusyId(appointmentId);
    try {
      const result = await checkIn({ variables: { appointmentId } });
      await finish(result.data?.checkIn.errors[0], "受付しました。診察の開始まで、お待ちください");
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = async (appointmentId: string) => {
    try {
      const result = await cancelAppointment({
        variables: { appointmentId },
        // 空いた枠は「空いている枠」の一覧に戻るので、そちらのキャッシュは捨てて、次に開いたときに取り直させる
        update(cache, { data: payload }) {
          if (payload?.cancelAppointment.appointment) {
            cache.evict({ id: "ROOT_QUERY", fieldName: "availableSlots" });
            cache.gc();
          }
        },
      });
      await finish(result.data?.cancelAppointment.errors[0], "予約をキャンセルしました");
    } catch {
      // 同上
    }
  };

  const onLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchMore({ variables: { after: data?.appointments.pageInfo.endCursor } });
    } catch {
      // 同上
    } finally {
      setLoadingMore(false);
    }
  };

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return (
      <ErrorMessage title="予約の一覧を読み込めませんでした" description="時間をおいて、開き直してください" />
    );
  if (!data) return null;

  const appointments = data.appointments.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
  if (appointments.length === 0) {
    return (
      <Stack gap="4">
        <EmptyMessage title={emptyTitle} />
        {showBookLink ? (
          <Center>
            <Button size="lg" colorPalette="teal" asChild>
              <NextLink href="/book">予約する</NextLink>
            </Button>
          </Center>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack gap="4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onCheckIn={onCheckIn}
          onCancel={onCancel}
          checkingIn={busyId === appointment.id}
          disabled={busyId !== null}
        />
      ))}
      {data.appointments.pageInfo.hasNextPage ? (
        <Center>
          <Button variant="outline" onClick={onLoadMore} loading={loadingMore}>
            続きを読み込む
          </Button>
        </Center>
      ) : null}
    </Stack>
  );
}

// 患者の「自分の予約」。これからの予約と、過去の予約を、タブで分ける。開いているタブは URL に置く
export function MyAppointments() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "past" ? "past" : "upcoming";
  // 「今日」は、画面を開いたときに1回だけ決める（描き直しのたびに変わると、一覧を取り直してしまう）
  const [today] = useState(() => toDateInTokyo(new Date()));

  return (
    <Tabs.Root
      value={tab}
      colorPalette="teal"
      onValueChange={({ value }) => router.replace(value === "past" ? `${pathname}?tab=past` : pathname)}
      lazyMount
    >
      <Tabs.List mb="4">
        <Tabs.Trigger value="upcoming">これからの予約</Tabs.Trigger>
        <Tabs.Trigger value="past">過去の予約</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="upcoming">
        <AppointmentCards filter={{ from: today }} emptyTitle="これからの予約はありません" showBookLink />
      </Tabs.Content>
      <Tabs.Content value="past">
        <AppointmentCards
          filter={{ to: addDays(today, -1) }}
          descending
          emptyTitle="過去の予約はありません"
        />
      </Tabs.Content>
    </Tabs.Root>
  );
}
