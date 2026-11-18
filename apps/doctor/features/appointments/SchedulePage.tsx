"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Center, HStack, Heading, IconButton, Input, Stack, Text } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { notifyError, notifySuccess } from "@clinic/ui/toaster";
import { addDays, formatDate, isDateString, toDateInTokyo } from "@clinic/web-kit/datetime";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  FinishConsultationDocument,
  ScheduleDocument,
  StartConsultationDocument,
} from "./appointments.graphql";
import { ScheduleItem } from "./ScheduleItem";

// 1日の、自分が担当の予約。開いたときは今日。見ている日は URL に置く（?date=YYYY-MM-DD）
export function SchedulePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 「今日」は、画面を開いたときに1回だけ決める
  const [today] = useState(() => toDateInTokyo(new Date()));
  const dateParam = searchParams.get("date");
  const date = isDateString(dateParam) ? dateParam : today;

  const { data, loading, error, fetchMore, refetch } = useQuery(ScheduleDocument, {
    // キャンセルした予約は、予定から外す（状態で絞らず、画面で外すと、件数とページがずれる）
    variables: { filter: { from: date, to: date } },
    fetchPolicy: "cache-and-network",
    // 受付は患者がする。受付済になったことに気づけるように、30秒ごとに取り直す
    pollInterval: 30_000,
  });
  const [start] = useMutation(StartConsultationDocument);
  const [finish] = useMutation(FinishConsultationDocument);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const go = (next: string) =>
    router.replace(next === today ? pathname : `${pathname}?date=${next}`, { scroll: false });

  // 予定の1件は、返ってきた予約（同じ id）でキャッシュが自動で新しくなる。取り直すのは、断られたときだけ
  const finishWith = async (userError: { message: string } | undefined, done: string) => {
    if (userError) {
      notifyError(userError.message);
      await refetch();
    } else {
      notifySuccess(done);
    }
  };

  const onStart = async (appointmentId: string) => {
    setBusyId(appointmentId);
    try {
      const result = await start({ variables: { appointmentId } });
      await finishWith(result.data?.startConsultation.errors[0], "診察を始めました");
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    } finally {
      setBusyId(null);
    }
  };

  const onFinish = async (appointmentId: string) => {
    try {
      const result = await finish({ variables: { appointmentId } });
      await finishWith(
        result.data?.finishConsultation.errors[0],
        "診察を終えました。会計は事務スタッフに回ります",
      );
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

  const all = data?.appointments.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
  const appointments = all.filter((each) => each.status !== "CANCELED");

  return (
    <Box>
      <HStack mb="5" gap="3" wrap="wrap">
        <IconButton aria-label="前の日" variant="outline" onClick={() => go(addDays(date, -1))}>
          ‹
        </IconButton>
        <Heading as="h2" size="lg" className="tabular" minW="36" textAlign="center">
          {formatDate(`${date}T00:00:00+09:00`)}
        </Heading>
        <IconButton aria-label="次の日" variant="outline" onClick={() => go(addDays(date, 1))}>
          ›
        </IconButton>
        {date !== today ? (
          <Button variant="ghost" colorPalette="teal" onClick={() => go(today)}>
            今日
          </Button>
        ) : null}
        <Input
          type="date"
          width="auto"
          aria-label="日付を選ぶ"
          value={date}
          onChange={(event) => event.target.value && go(event.target.value)}
        />
        <Text color="app.muted" ms="auto">
          {appointments.length} 件
        </Text>
      </HStack>
      {!data && loading ? (
        <LoadingMessage />
      ) : !data && error ? (
        <ErrorMessage title="予定を読み込めませんでした" description="時間をおいて、開き直してください" />
      ) : appointments.length === 0 ? (
        <EmptyMessage title="この日の診察の予定は、ありません" />
      ) : (
        <Stack gap="3">
          {appointments.map((appointment) => (
            <ScheduleItem
              key={appointment.id}
              appointment={appointment}
              onStart={onStart}
              onFinish={onFinish}
              busy={busyId === appointment.id}
              disabled={busyId !== null}
            />
          ))}
        </Stack>
      )}
      {data?.appointments.pageInfo.hasNextPage ? (
        <Center mt="4">
          <Button variant="outline" onClick={onLoadMore} loading={loadingMore}>
            続きを読み込む
          </Button>
        </Center>
      ) : null}
    </Box>
  );
}
