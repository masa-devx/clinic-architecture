"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Center } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { notifyError, notifySuccess } from "@clinic/ui/toaster";
import { useState } from "react";
import type { AppointmentFilter } from "@/lib/gql/graphql";
import { AppointmentTable, type RowAction } from "./AppointmentTable";
import {
  AppointmentsDocument,
  CancelAppointmentDocument,
  CheckInDocument,
  FinishConsultationDocument,
  StartConsultationDocument,
} from "./appointments.graphql";

type Props = {
  filter: AppointmentFilter;
  descending?: boolean;
  showPatient: boolean;
  showClinic: boolean;
  emptyTitle: string;
  rescheduleHref: (appointmentId: string, clinicId: string) => string;
  questionnaireHref: (appointmentId: string) => string;
  billHref: (billId: string) => string;
};

const DONE: Record<RowAction, string> = {
  checkIn: "受付しました",
  start: "診察を始めました",
  finish: "診察を終えました",
  cancel: "予約をキャンセルしました",
};

// 予約の一覧を取って、表（AppointmentTable）に渡す。続きの読み込みと、行の操作（受付・診察・キャンセル）も、ここが持つ
export function AppointmentList({
  filter,
  descending = false,
  showPatient,
  showClinic,
  emptyTitle,
  rescheduleHref,
  questionnaireHref,
  billHref,
}: Props) {
  const { data, loading, error, fetchMore, refetch } = useQuery(AppointmentsDocument, {
    variables: { filter, descending },
    // 開くたびに取り直す（ほかの人の操作で変わるため）。取り直すあいだは、キャッシュの一覧を出しておく
    fetchPolicy: "cache-and-network",
  });
  const [cancelAppointment] = useMutation(CancelAppointmentDocument);
  const [checkIn] = useMutation(CheckInDocument);
  const [startConsultation] = useMutation(StartConsultationDocument);
  const [finishConsultation] = useMutation(FinishConsultationDocument);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // 行は、返ってきた予約（同じ id）でキャッシュが自動で新しくなる。一覧を取り直すのは、断られたときだけ
  const send = async (action: RowAction, appointmentId: string) => {
    const variables = { appointmentId };
    switch (action) {
      case "checkIn":
        return (await checkIn({ variables })).data?.checkIn.errors[0];
      case "start":
        return (await startConsultation({ variables })).data?.startConsultation.errors[0];
      case "finish":
        return (await finishConsultation({ variables })).data?.finishConsultation.errors[0];
      case "cancel": {
        const result = await cancelAppointment({
          variables,
          // 空いた枠は「空いている枠」の一覧に戻るので、そちらのキャッシュは捨てて、次に開いたときに取り直させる
          update(cache, { data: payload }) {
            if (payload?.cancelAppointment.appointment) {
              cache.evict({ id: "ROOT_QUERY", fieldName: "availableSlots" });
              cache.gc();
            }
          },
        });
        return result.data?.cancelAppointment.errors[0];
      }
    }
  };

  const onAction = async (action: RowAction, appointmentId: string) => {
    if (action === "cancel" && !window.confirm("この予約をキャンセルしますか？")) return;
    setBusyKey(`${action}:${appointmentId}`);
    try {
      const userError = await send(action, appointmentId);
      if (userError) {
        notifyError(userError.message);
        // 断られたのは、ほかの人の操作や時刻で、状態が変わっていたから。一覧を取り直して、今の状態を出す
        await refetch();
      } else {
        notifySuccess(DONE[action]);
      }
    } catch {
      // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
    } finally {
      setBusyKey(null);
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
  if (appointments.length === 0) return <EmptyMessage title={emptyTitle} />;

  return (
    <Box>
      <AppointmentTable
        appointments={appointments}
        showPatient={showPatient}
        showClinic={showClinic}
        rescheduleHref={rescheduleHref}
        questionnaireHref={questionnaireHref}
        billHref={billHref}
        onAction={onAction}
        busyKey={busyKey}
      />
      {data.appointments.pageInfo.hasNextPage ? (
        <Center mt="4">
          <Button variant="outline" onClick={onLoadMore} loading={loadingMore}>
            続きを読み込む
          </Button>
        </Center>
      ) : null}
    </Box>
  );
}
