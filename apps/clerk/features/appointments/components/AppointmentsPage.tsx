"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Center, Field, HStack, Input, NativeSelect } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { Surface } from "@clinic/ui/surface";
import { notifyError, notifySuccess } from "@clinic/ui/toaster";
import { toDateInTokyo } from "@clinic/web-kit/datetime";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useViewer } from "@/lib/viewer-context";
import { AppointmentTable } from "./AppointmentTable";
import { AppointmentsDocument, CancelAppointmentDocument } from "../graphql/appointments.generated";
import { staffFilterFromParams, withFilter, type FilterKey } from "../filters";
import { STATUSES, STATUS_LABELS } from "../status";

// 自院の予約の一覧。絞り込み（日付・医師・状態）は URL に置く。リロードしても、URL を渡しても、同じ一覧になる。
// 開いたときは「今日から」。「この日から」を空にすると、過去も出る
export function AppointmentsPage() {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 「今日」は、画面を開いたときに1回だけ決める
  const [today] = useState(() => toDateInTokyo(new Date()));
  const filter = staffFilterFromParams(searchParams, today);

  const { data, loading, error, fetchMore, refetch } = useQuery(AppointmentsDocument, {
    variables: { filter },
    // 開くたびに取り直す（ほかの人の操作で変わるため）。取り直すあいだは、キャッシュの一覧を出しておく
    fetchPolicy: "cache-and-network",
  });
  const [cancelAppointment] = useMutation(CancelAppointmentDocument);
  const [loadingMore, setLoadingMore] = useState(false);

  const setFilter = (key: FilterKey, value: string) => {
    const query = withFilter(searchParams.toString(), key, value);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const onCancel = async (appointmentId: string) => {
    try {
      const result = await cancelAppointment({
        variables: { appointmentId },
        // 行は、返ってきた予約（同じ id）でキャッシュが自動で新しくなる。
        // 空いた枠は「空いている枠」の一覧に戻るので、そちらのキャッシュは捨てて、次に開いたときに取り直させる
        update(cache, { data: payload }) {
          if (payload?.cancelAppointment.appointment) {
            cache.evict({ id: "ROOT_QUERY", fieldName: "availableSlots" });
            cache.gc();
          }
        },
      });
      const userError = result.data?.cancelAppointment.errors[0];
      if (userError) {
        notifyError(userError.message);
        // 断られたのは、ほかの人の操作や時刻で、状態が変わっていたから。一覧を取り直して、今の状態を出す
        await refetch();
      } else {
        notifySuccess("予約をキャンセルしました");
      }
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
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

  const appointments = data?.appointments.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];

  return (
    <Box>
      <Surface mb="5" py="4">
        <HStack
          as="form"
          gap="4"
          wrap="wrap"
          align="end"
          aria-label="絞り込み"
          onSubmit={(event) => event.preventDefault()}
        >
          <Field.Root width="auto">
            <Field.Label>この日から</Field.Label>
            <Input
              type="date"
              value={filter.from ?? ""}
              onChange={(event) => setFilter("from", event.target.value)}
            />
          </Field.Root>
          <Field.Root width="auto">
            <Field.Label>この日まで</Field.Label>
            <Input
              type="date"
              value={filter.to ?? ""}
              onChange={(event) => setFilter("to", event.target.value)}
            />
          </Field.Root>
          <Field.Root width="auto">
            <Field.Label>医師</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={filter.doctorId ?? ""}
                onChange={(event) => setFilter("doctor", event.target.value)}
              >
                <option value="">全員</option>
                {viewer.clinic?.doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          <Field.Root width="auto">
            <Field.Label>状態</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={filter.status ?? ""}
                onChange={(event) => setFilter("status", event.target.value)}
              >
                <option value="">すべて</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
        </HStack>
      </Surface>

      {!data && loading ? (
        <LoadingMessage />
      ) : !data && error ? (
        <ErrorMessage
          title="予約の一覧を読み込めませんでした"
          description="時間をおいて、開き直してください"
        />
      ) : appointments.length === 0 ? (
        <EmptyMessage title="条件に合う予約はありません" />
      ) : (
        <AppointmentTable appointments={appointments} onCancel={onCancel} />
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
