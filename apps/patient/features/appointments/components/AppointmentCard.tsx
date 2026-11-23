import type { FragmentType } from "@apollo/client";
import { useFragment } from "@apollo/client/react";
import { Box, Button, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { ConfirmButton } from "@clinic/ui/confirm-button";
import { StatusBadge } from "@clinic/ui/status-badge";
import { Surface } from "@clinic/ui/surface";
import { formatDate, formatTime } from "@clinic/web-kit/datetime";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  BILL_STATUS_LABELS,
  formatYen,
} from "@clinic/web-kit/labels";
import NextLink from "next/link";
import {
  AppointmentCardFieldsFragmentDoc,
  type AppointmentCardFieldsFragment,
} from "../graphql/appointments.generated";

type Actions = {
  onCheckIn: (appointmentId: string) => void;
  onCancel: (appointmentId: string) => Promise<void>;
  // 受付を送っている最中か（ボタンを「送信中」にする）
  checkingIn: boolean;
  // ほかのカードの操作を送っている最中か（押せなくする）
  disabled: boolean;
};

// 予約のカード1枚。親（MyAppointments）からは、中身の隠れた予約（data masking）を受け取る。
// この部品の fragment（AppointmentCardFields）の中身を、キャッシュから読んで、描く部品に渡す
export function AppointmentCard({
  appointment,
  ...actions
}: Actions & { appointment: FragmentType<AppointmentCardFieldsFragment> }) {
  const { data, complete } = useFragment({ fragment: AppointmentCardFieldsFragmentDoc, from: appointment });
  if (!complete) return null;
  return <AppointmentCardView appointment={data} {...actions} />;
}

// 予約のカード1枚を描く。日時を大きく出し、今できる操作を、大事な順に並べる。props だけで描く（データは取らない）。
// どのボタンを出すかは、サーバーが返す can〜 の項目で決める（決まりを、画面に写さない）
export function AppointmentCardView({
  appointment,
  onCheckIn,
  onCancel,
  checkingIn,
  disabled,
}: Actions & { appointment: AppointmentCardFieldsFragment }) {
  const { slot, bill } = appointment;
  const when = `${formatDate(slot.startsAt)} ${formatTime(slot.startsAt)}`;

  return (
    <Surface as="article" aria-label={`${when} ${slot.doctor.name} の予約`}>
      <Flex justify="space-between" align="start" gap="3">
        <Box>
          <Text className="tabular" fontSize="2xl" fontWeight="bold" lineHeight="1.3">
            {formatDate(slot.startsAt)}
            <Text as="span" ms="3">
              {formatTime(slot.startsAt)}〜{formatTime(slot.endsAt)}
            </Text>
          </Text>
          <Text mt="1">
            {slot.clinic.name}
            <Text as="span" color="app.muted" ms="2">
              {slot.doctor.name} 医師
            </Text>
          </Text>
        </Box>
        <StatusBadge
          size="lg"
          label={APPOINTMENT_STATUS_LABELS[appointment.status]}
          color={APPOINTMENT_STATUS_COLORS[appointment.status]}
        />
      </Flex>

      {bill ? (
        <HStack mt="4" p="3" bg="app.bg" rounded="md" justify="space-between">
          <Text>
            会計：{BILL_STATUS_LABELS[bill.status]}
            {bill.totalAmount !== null ? (
              <Text as="span" className="tabular" fontWeight="bold" ms="2">
                {formatYen(bill.totalAmount)}
              </Text>
            ) : null}
          </Text>
          <Button size="sm" variant="outline" asChild>
            <NextLink href={`/bills/${bill.id}`}>明細を見る</NextLink>
          </Button>
        </HStack>
      ) : null}

      <Stack mt="4" gap="2" direction={{ base: "column", sm: "row" }} wrap="wrap">
        {appointment.canCheckIn ? (
          <Button
            size="lg"
            colorPalette="teal"
            loading={checkingIn}
            disabled={disabled}
            onClick={() => onCheckIn(appointment.id)}
          >
            受付する
          </Button>
        ) : null}
        {appointment.canAnswerQuestionnaire ? (
          <Button
            size="lg"
            variant={appointment.questionnaire?.submitted ? "outline" : "solid"}
            colorPalette="teal"
            asChild
          >
            <NextLink href={`/appointments/${appointment.id}/questionnaire`}>
              {appointment.questionnaire?.submitted ? "問診を直す" : "問診に答える"}
            </NextLink>
          </Button>
        ) : null}
        {appointment.canCancel ? (
          <>
            <Button size="lg" variant="outline" asChild>
              <NextLink href={`/book/${slot.clinic.id}?reschedule=${appointment.id}`}>時刻を変える</NextLink>
            </Button>
            <ConfirmButton
              size="lg"
              variant="ghost"
              colorPalette="red"
              disabled={disabled}
              title="この予約をキャンセルしますか？"
              description={`${when}　${slot.clinic.name}　${slot.doctor.name} 医師`}
              confirmLabel="キャンセルする"
              danger
              onConfirm={() => onCancel(appointment.id)}
            >
              キャンセル
            </ConfirmButton>
          </>
        ) : null}
      </Stack>
    </Surface>
  );
}
