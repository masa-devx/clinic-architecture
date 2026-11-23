import type { FragmentType } from "@apollo/client";
import { useFragment } from "@apollo/client/react";
import { Button, HStack, Link, Table, Text } from "@chakra-ui/react";
import { ConfirmButton } from "@clinic/ui/confirm-button";
import { StatusBadge } from "@clinic/ui/status-badge";
import { Surface } from "@clinic/ui/surface";
import { formatDate, formatTime } from "@clinic/web-kit/datetime";
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  BILL_STATUS_COLORS,
  BILL_STATUS_LABELS,
  formatYen,
} from "@clinic/web-kit/labels";
import NextLink from "next/link";
import {
  AppointmentRowFieldsFragmentDoc,
  type AppointmentRowFieldsFragment,
} from "../graphql/appointments.generated";

type Props = {
  // 中身の隠れた予約（data masking）。見えるのは、一覧のクエリが自分で選んだ id だけ。
  // 中身は、1行ずつ、行の部品（AppointmentRow）が fragment を読む
  appointments: readonly ({ id: string } & FragmentType<AppointmentRowFieldsFragment>)[];
  onCancel: (appointmentId: string) => Promise<void>;
};

// 予約の一覧の表（見出しと、行の並び）。データは取らない
export function AppointmentTable({ appointments, onCancel }: Props) {
  return (
    <Surface p="0" overflow="hidden">
      <Table.ScrollArea>
        <Table.Root size="md" interactive>
          <Table.Header>
            <Table.Row bg="app.brandSubtle">
              <Table.ColumnHeader>日付</Table.ColumnHeader>
              <Table.ColumnHeader>時間</Table.ColumnHeader>
              <Table.ColumnHeader>患者</Table.ColumnHeader>
              <Table.ColumnHeader>医師</Table.ColumnHeader>
              <Table.ColumnHeader>状態</Table.ColumnHeader>
              <Table.ColumnHeader>会計</Table.ColumnHeader>
              <Table.ColumnHeader />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {appointments.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} onCancel={onCancel} />
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Surface>
  );
}

// 予約の一覧の1行。親から受け取った予約の、この行の fragment（AppointmentRowFields）を、キャッシュから読んで描く部品に渡す
function AppointmentRow({
  appointment,
  onCancel,
}: {
  appointment: FragmentType<AppointmentRowFieldsFragment>;
  onCancel: (appointmentId: string) => Promise<void>;
}) {
  const { data, complete } = useFragment({ fragment: AppointmentRowFieldsFragmentDoc, from: appointment });
  if (!complete) return null;
  return <AppointmentRowView appointment={data} onCancel={onCancel} />;
}

// 予約の一覧の1行を描く。props だけで描く（データは取らない）。
// どのボタンを出すかは、サーバーが返す can〜 の項目で決める（決まりを、画面に写さない）
export function AppointmentRowView({
  appointment,
  onCancel,
}: {
  appointment: AppointmentRowFieldsFragment;
  onCancel: (appointmentId: string) => Promise<void>;
}) {
  const { slot, bill } = appointment;
  const when = `${formatDate(slot.startsAt)} ${formatTime(slot.startsAt)}`;
  return (
    <Table.Row key={appointment.id}>
      <Table.Cell whiteSpace="nowrap" className="tabular">
        {formatDate(slot.startsAt)}
      </Table.Cell>
      <Table.Cell whiteSpace="nowrap" className="tabular" fontWeight="bold">
        {formatTime(slot.startsAt)}〜{formatTime(slot.endsAt)}
      </Table.Cell>
      <Table.Cell>
        {appointment.patient.name}
        {appointment.bookedByStaff ? (
          <Text as="span" ms="2" fontSize="xs" color="app.muted">
            （代理）
          </Text>
        ) : null}
      </Table.Cell>
      <Table.Cell>{slot.doctor.name}</Table.Cell>
      <Table.Cell>
        <StatusBadge
          label={APPOINTMENT_STATUS_LABELS[appointment.status]}
          color={APPOINTMENT_STATUS_COLORS[appointment.status]}
        />
      </Table.Cell>
      <Table.Cell whiteSpace="nowrap">
        {bill ? (
          <Link asChild colorPalette="teal">
            <NextLink href={`/bills/${bill.id}`}>
              <StatusBadge
                size="sm"
                label={BILL_STATUS_LABELS[bill.status]}
                color={BILL_STATUS_COLORS[bill.status]}
              />
              <Text as="span" className="tabular">
                {bill.totalAmount !== null ? formatYen(bill.totalAmount) : "明細を入れる"}
              </Text>
            </NextLink>
          </Link>
        ) : (
          <Text color="app.muted">—</Text>
        )}
      </Table.Cell>
      <Table.Cell>
        <HStack justify="end" gap="2">
          {appointment.canCancel && appointment.status === "BOOKED" ? (
            <Button size="xs" variant="outline" asChild>
              <NextLink href={`/slots?reschedule=${appointment.id}`}>時刻を変える</NextLink>
            </Button>
          ) : null}
          {appointment.canCancel ? (
            <ConfirmButton
              size="xs"
              variant="outline"
              colorPalette="red"
              title="この予約をキャンセルしますか？"
              description={`${when}　${appointment.patient.name} さま　${slot.doctor.name} 医師`}
              confirmLabel="キャンセルする"
              danger
              onConfirm={() => onCancel(appointment.id)}
            >
              キャンセル
            </ConfirmButton>
          ) : null}
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}
