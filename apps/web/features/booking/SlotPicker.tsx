"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Center, Field, HStack, Input, NativeSelect } from "@chakra-ui/react";
import { PageHeader } from "@clinic/ui/page-header";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { notifySuccess } from "@clinic/ui/toaster";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AvailableSlotsDocument,
  BookAppointmentDocument,
  CloseSlotDocument,
  RescheduleAppointmentDocument,
} from "./booking.graphql";
import { SlotList } from "./SlotList";

type Props = {
  clinicId: string;
  // patient: 患者が自分の予約を入れる。staff: スタッフが、枠を閉じる・（事務スタッフなら）患者の代わりに予約を入れる
  mode: "patient" | "staff";
  // 患者の代わりに予約を入れられるか（事務スタッフだけ）
  canProxyBook?: boolean;
  // 予約・変更のあとに移る画面
  donePath: string;
};

// 医療機関の空いている枠から、1つ選んで予約する。
// URL に ?reschedule=<予約の id> があれば、その予約の時刻を、選んだ枠に変える。医師での絞り込みも URL に置く
export function SlotPicker({ clinicId, mode, canProxyBook = false, donePath }: Props) {
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
  const [closeSlot] = useMutation(CloseSlotDocument);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // 代わりに予約を入れる患者のメールアドレス。送るまでの、入力中の値
  const [patientEmail, setPatientEmail] = useState("");

  const proxy = mode === "staff" && canProxyBook && !rescheduleId;
  const canSelect = mode === "patient" || canProxyBook || !!rescheduleId;

  // 結果を待ってから画面を変える（先に「できた」と見せない）。
  // 同じ枠にほかの人が先に入ることがあり、そのとき「できた」を取り消して見せるより、少し待つほうが害が小さい
  const onSelect = async (slotId: string) => {
    if (proxy && !patientEmail.trim()) return setActionError("患者のメールアドレスを入れてください");
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
              variables: { slotId, patientEmail: proxy ? patientEmail.trim() : null },
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
      if (proxy) {
        setPatientEmail("");
        await refetch();
      } else {
        router.push(donePath);
      }
    } catch {
      // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
    } finally {
      setBusyId(null);
    }
  };

  const onClose = async (slotId: string) => {
    if (!window.confirm("この枠を閉じますか？（閉じた枠は、予約できなくなります）")) return;
    setBusyId(`close-${slotId}`);
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
    } finally {
      setBusyId(null);
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
  const description = rescheduleId
    ? "予約の時刻を変えます。空いている枠から、新しい時間を選んでください"
    : mode === "patient"
      ? "空いている枠から、予約する時間を選んでください"
      : "空いている枠の一覧です";

  return (
    <Box>
      <PageHeader title={data.clinic.name} description={description} />
      <HStack gap="4" mb="5" align="end" wrap="wrap">
        <Field.Root width="auto">
          <Field.Label>医師</Field.Label>
          <NativeSelect.Root bg="white" width="xs">
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
        {proxy ? (
          <Field.Root width="auto">
            <Field.Label>代わりに予約を入れる患者のメールアドレス</Field.Label>
            <Input
              type="email"
              bg="white"
              width="xs"
              value={patientEmail}
              onChange={(event) => setPatientEmail(event.target.value)}
            />
          </Field.Root>
        ) : null}
      </HStack>
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
        <SlotList
          slots={slots}
          onSelect={canSelect ? onSelect : undefined}
          selectLabel={rescheduleId ? "この時刻に変える" : proxy ? "代わりに予約する" : "予約する"}
          onClose={mode === "staff" && !rescheduleId ? onClose : undefined}
          busyId={busyId}
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
