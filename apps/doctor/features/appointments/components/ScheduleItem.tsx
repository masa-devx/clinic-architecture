import type { FragmentType } from "@apollo/client";
import { useFragment } from "@apollo/client/react";
import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { ConfirmButton } from "@clinic/ui/confirm-button";
import { StatusBadge } from "@clinic/ui/status-badge";
import { Surface } from "@clinic/ui/surface";
import { formatTime } from "@clinic/web-kit/datetime";
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@clinic/web-kit/labels";
import NextLink from "next/link";
import {
  ScheduleItemFieldsFragmentDoc,
  type ScheduleItemFieldsFragment,
} from "../graphql/appointments.generated";

type Actions = {
  onStart: (appointmentId: string) => void;
  onFinish: (appointmentId: string) => Promise<void>;
  // この予約の操作を送っている最中か
  busy: boolean;
  // ほかの予約の操作を送っている最中か（押せなくする）
  disabled: boolean;
};

// 診察の予定の1件。親（SchedulePage）からは、中身の隠れた予約（data masking）を受け取る。
// この部品の fragment（ScheduleItemFields）の中身を、キャッシュから読んで、描く部品に渡す
export function ScheduleItem({
  appointment,
  ...actions
}: Actions & { appointment: FragmentType<ScheduleItemFieldsFragment> }) {
  const { data, complete } = useFragment({ fragment: ScheduleItemFieldsFragmentDoc, from: appointment });
  if (!complete) return null;
  return <ScheduleItemView appointment={data} {...actions} />;
}

// 診察の予定の1件を描く。左に時刻、真ん中に患者と問診、右に今できる操作。props だけで描く（データは取らない）。
// どのボタンを出すかは、サーバーが返す can〜 の項目で決める（決まりを、画面に写さない）
export function ScheduleItemView({
  appointment,
  onStart,
  onFinish,
  busy,
  disabled,
}: Actions & { appointment: ScheduleItemFieldsFragment }) {
  const { slot, patient, questionnaire } = appointment;
  // 受付済（すぐ診察できる）と診察中の予約は、左の線で目立たせる
  const accent =
    appointment.status === "IN_CONSULTATION"
      ? "purple.500"
      : appointment.status === "CHECKED_IN"
        ? "teal.500"
        : "transparent";

  return (
    <Surface
      as="article"
      aria-label={`${formatTime(slot.startsAt)} ${patient.name}`}
      borderLeftWidth="6px"
      borderLeftColor={accent}
      py="4"
    >
      <Flex align="center" gap="5" wrap="wrap">
        <Text className="tabular" fontSize="xl" fontWeight="bold" w="32" flexShrink="0">
          {formatTime(slot.startsAt)}
          <Text as="span" fontSize="sm" fontWeight="normal" color="app.muted">
            〜{formatTime(slot.endsAt)}
          </Text>
        </Text>
        <Box flex="1" minW="48">
          <Text fontSize="lg" fontWeight="bold">
            {patient.name} さま
          </Text>
          <Text fontSize="sm" color="app.muted">
            問診：{questionnaire ? (questionnaire.submitted ? "提出済" : "途中まで（未提出）") : "なし"}
          </Text>
        </Box>
        <StatusBadge
          label={APPOINTMENT_STATUS_LABELS[appointment.status]}
          color={APPOINTMENT_STATUS_COLORS[appointment.status]}
        />
        <HStack gap="2">
          {appointment.canViewQuestionnaire && questionnaire ? (
            <Button variant="outline" asChild>
              <NextLink href={`/appointments/${appointment.id}`}>問診を見る</NextLink>
            </Button>
          ) : null}
          {appointment.canStartConsultation ? (
            <Button
              colorPalette="teal"
              loading={busy}
              disabled={disabled}
              onClick={() => onStart(appointment.id)}
            >
              診察を始める
            </Button>
          ) : null}
          {appointment.canFinishConsultation ? (
            <ConfirmButton
              colorPalette="purple"
              disabled={disabled}
              title="診察を終えますか？"
              description={`${patient.name} さま。終えると、会計の下書きができ、事務スタッフに回ります。`}
              confirmLabel="診察を終える"
              onConfirm={() => onFinish(appointment.id)}
            >
              診察を終える
            </ConfirmButton>
          ) : null}
        </HStack>
      </Flex>
    </Surface>
  );
}
