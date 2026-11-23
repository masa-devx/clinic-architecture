"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Center, Field, HStack, Input, NativeSelect } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { Surface } from "@clinic/ui/surface";
import { notifySuccess } from "@clinic/ui/toaster";
import { SlotRows } from "@clinic/web-kit/staff/slot-rows";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useViewer } from "@/lib/viewer-context";
import {
  AvailableSlotsDocument,
  BookAppointmentDocument,
  CloseSlotDocument,
  RescheduleAppointmentDocument,
} from "../graphql/slots.generated";

// 自院の空いている枠。枠を閉じる・患者の代わりに予約を入れる。
// URL に ?reschedule=<予約の id> があれば、その予約の時刻を、選んだ枠に変える
export function SlotsPage() {
  const viewer = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const doctorParam = searchParams.get("doctor");
  const doctorId = doctorParam && /^\d+$/.test(doctorParam) ? doctorParam : null;
  const rescheduleParam = searchParams.get("reschedule");
  const rescheduleId = rescheduleParam && /^\d+$/.test(rescheduleParam) ? rescheduleParam : null;

  const { data, loading, error, fetchMore, refetch } = useQuery(AvailableSlotsDocument, {
    variables: { doctorId },
    // 空きは、ほかの人の予約で変わる。開くたびに取り直す
    fetchPolicy: "cache-and-network",
  });
  const [bookAppointment] = useMutation(BookAppointmentDocument);
  const [rescheduleAppointment] = useMutation(RescheduleAppointmentDocument);
  const [closeSlot] = useMutation(CloseSlotDocument);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // 代わりに予約を入れる患者のメールアドレス。送るまでの、入力中の値
  const [patientEmail, setPatientEmail] = useState("");

  const onSelect = async (slotId: string) => {
    if (!rescheduleId && !patientEmail.trim()) {
      setActionError("患者のメールアドレスを入れてください");
      return;
    }
    setBusyId(slotId);
    setActionError(null);
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
              variables: { slotId, patientEmail: patientEmail.trim() },
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
      if (rescheduleId) {
        notifySuccess("予約の時刻を変えました");
        router.push("/appointments");
      } else {
        notifySuccess("予約しました");
        setPatientEmail("");
        await refetch();
      }
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    } finally {
      setBusyId(null);
    }
  };

  const onClose = async (slotId: string) => {
    setActionError(null);
    try {
      const result = await closeSlot({ variables: { slotId } });
      const userError = result.data?.closeSlot.errors[0];
      if (userError) setActionError(userError.message);
      else notifySuccess("枠を閉じました");
      // 閉じた枠（閉じられなかったなら、予約が入った枠）を、一覧から消す
      await refetch();
    } catch {
      // 同上
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

  const slots = data?.availableSlots.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];

  return (
    <Box>
      <Surface mb="5" py="4">
        <HStack gap="4" align="end" wrap="wrap">
          <Field.Root width="auto">
            <Field.Label>医師</Field.Label>
            <NativeSelect.Root width="xs">
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
                {viewer.clinic?.doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          {rescheduleId ? null : (
            <Field.Root width="auto">
              <Field.Label>代わりに予約を入れる患者のメールアドレス</Field.Label>
              <Input
                type="email"
                width="sm"
                value={patientEmail}
                onChange={(event) => setPatientEmail(event.target.value)}
              />
            </Field.Root>
          )}
        </HStack>
      </Surface>
      {actionError ? (
        <Box mb="4">
          <ErrorMessage title={actionError} />
        </Box>
      ) : null}
      {!data && loading ? (
        <LoadingMessage />
      ) : !data && error ? (
        <ErrorMessage
          title="空いている枠を読み込めませんでした"
          description="時間をおいて、開き直してください"
        />
      ) : slots.length === 0 ? (
        <EmptyMessage title="空いている枠がありません" description="「診療枠を作る」から、枠を足せます" />
      ) : (
        <SlotRows
          slots={slots}
          onClose={onClose}
          select={{
            label: rescheduleId ? "この時刻に変える" : "代わりに予約する",
            confirmTitle: rescheduleId
              ? "この時刻に変えますか？"
              : `${patientEmail.trim() || "（メールアドレスが空です）"} さまの代わりに、予約を入れますか？`,
            onSelect,
          }}
          busyId={busyId}
        />
      )}
      {data?.availableSlots.pageInfo.hasNextPage ? (
        <Center mt="5">
          <Button variant="outline" onClick={onLoadMore} loading={loadingMore}>
            続きを読み込む
          </Button>
        </Center>
      ) : null}
    </Box>
  );
}
