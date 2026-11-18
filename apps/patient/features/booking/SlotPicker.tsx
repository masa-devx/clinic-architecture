"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Center, Field, NativeSelect } from "@chakra-ui/react";
import { PageHeader } from "@clinic/ui/page-header";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { notifySuccess } from "@clinic/ui/toaster";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AvailableSlotsDocument,
  BookAppointmentDocument,
  RescheduleAppointmentDocument,
} from "./booking.graphql";
import { SlotGrid } from "./SlotGrid";

// 医療機関の空いている枠から、1つ選んで予約する。
// URL に ?reschedule=<予約の id> があれば、その予約の時刻を、選んだ枠に変える。医師での絞り込みも URL に置く
export function SlotPicker({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const doctorParam = searchParams.get("doctor");
  const doctorId = doctorParam && /^\d+$/.test(doctorParam) ? doctorParam : null;
  const rescheduleParam = searchParams.get("reschedule");
  const rescheduleId = rescheduleParam && /^\d+$/.test(rescheduleParam) ? rescheduleParam : null;

  const { data, loading, error, fetchMore, refetch } = useQuery(AvailableSlotsDocument, {
    variables: { clinicId, doctorId },
    // 空きは、ほかの人の予約で変わる。開くたびに取り直す
    fetchPolicy: "cache-and-network",
  });
  const [bookAppointment] = useMutation(BookAppointmentDocument);
  const [rescheduleAppointment] = useMutation(RescheduleAppointmentDocument);
  const [actionError, setActionError] = useState<string | null>(null);
  // 予約（時刻の変更）を送っているあいだは true。どの時刻のボタンも押せなくする
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // 結果を待ってから画面を変える（先に「できた」と見せない）。
  // 同じ枠にほかの人が先に入ることがあり、そのとき「できた」を取り消して見せるより、少し待つほうが害が小さい
  const onSelect = async (slotId: string) => {
    setActionError(null);
    setSending(true);
    try {
      // 予約が増える（変わる）と、空き枠も変わる。どちらの一覧のキャッシュも捨てて、次に開いたときに取り直させる
      const drop = (_: unknown, { DELETE }: { DELETE: unknown }) => DELETE;
      const evictLists = { fields: { appointments: drop, availableSlots: drop } };
      const userError = rescheduleId
        ? (
            await rescheduleAppointment({
              variables: { appointmentId: rescheduleId, slotId },
              update: (cache, { data: payload }) => {
                if (payload?.rescheduleAppointment.appointment) cache.modify(evictLists);
              },
            })
          ).data?.rescheduleAppointment.errors[0]
        : (
            await bookAppointment({
              variables: { slotId },
              update: (cache, { data: payload }) => {
                if (payload?.bookAppointment.appointment) cache.modify(evictLists);
              },
            })
          ).data?.bookAppointment.errors[0];
      if (userError) {
        setActionError(userError.message);
        // 「すでに埋まっています」などのときは、空きが変わっている。一覧を取り直して、埋まった枠を消す
        await refetch();
        return;
      }
      notifySuccess(rescheduleId ? "予約の時刻を変えました" : "予約しました");
      router.push("/appointments");
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    } finally {
      setSending(false);
    }
  };

  const onLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchMore({ variables: { after: data?.availableSlots.pageInfo.endCursor } });
    } catch {
      // 同上
    } finally {
      setLoadingMore(false);
    }
  };

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return (
      <ErrorMessage
        title="空いている枠を読み込めませんでした"
        description="時間をおいて、開き直してください"
      />
    );
  if (!data) return null;
  if (!data.clinic) return <ErrorMessage title="医療機関が見つかりません" />;

  const slots = data.availableSlots.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];

  return (
    <Box>
      <PageHeader
        title={data.clinic.name}
        description={
          rescheduleId
            ? "予約の時刻を変えます。空いている時刻から、新しい時間を選んでください"
            : "空いている時刻から、予約する時間を選んでください"
        }
      />
      <Field.Root mb="4">
        <Field.Label>医師</Field.Label>
        <NativeSelect.Root size="lg" bg="app.surface" maxW="xs">
          <NativeSelect.Field
            value={doctorId ?? ""}
            onChange={(event) => {
              const params = new URLSearchParams(searchParams.toString());
              if (event.target.value) params.set("doctor", event.target.value);
              else params.delete("doctor");
              const query = params.toString();
              router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
            }}
          >
            <option value="">全員</option>
            {data.clinic.doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>
      {actionError ? (
        <Box mb="4">
          <ErrorMessage title={actionError} />
        </Box>
      ) : null}
      {slots.length === 0 ? (
        <EmptyMessage
          title="空いている枠がありません"
          description="医師を変えるか、日をあらためて確かめてください"
        />
      ) : (
        <SlotGrid
          slots={slots}
          clinicName={data.clinic.name}
          mode={rescheduleId ? "reschedule" : "book"}
          onSelect={onSelect}
          busy={sending}
        />
      )}
      {data.availableSlots.pageInfo.hasNextPage ? (
        <Center mt="5">
          <Button variant="outline" onClick={onLoadMore} loading={loadingMore}>
            続きを読み込む
          </Button>
        </Center>
      ) : null}
    </Box>
  );
}
