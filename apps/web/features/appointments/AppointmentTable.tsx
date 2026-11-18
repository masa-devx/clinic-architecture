import { Badge, Button, HStack, Link, Table, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { BILL_STATUS_COLORS, BILL_STATUS_LABELS, formatYen } from "@/lib/bill-status";
import { getFragmentData, type FragmentType } from "@/lib/gql";
import { formatDate, formatTime } from "@/lib/datetime";
import { AppointmentRow } from "./appointments.graphql";
import { STATUS_COLORS, STATUS_LABELS } from "./status";

// 行のボタンで送る操作
export type RowAction = "checkIn" | "start" | "finish" | "cancel";

type Props = {
  appointments: readonly FragmentType<typeof AppointmentRow>[];
  // 患者の名前の列を出すか（スタッフの画面だけ）
  showPatient: boolean;
  // 医療機関の列を出すか（患者の画面だけ。スタッフは自院だけなので出さない）
  showClinic: boolean;
  // 時刻を変える画面の URL（予約の id と、医療機関の id から作る）
  rescheduleHref: (appointmentId: string, clinicId: string) => string;
  // 問診の画面の URL
  questionnaireHref: (appointmentId: string) => string;
  // 会計の画面の URL
  billHref: (billId: string) => string;
  onAction: (action: RowAction, appointmentId: string) => void;
  // 送っている最中の操作（"操作:予約の id"）。そのボタンを「送信中」にし、ほかのボタンは押せなくする
  busyKey: string | null;
};

// 予約の一覧の表。props だけで描く（データは取らない）。
// どのボタンを出すかは、サーバーが返す can〜 の項目で決める（決まりを、画面に写さない）
export function AppointmentTable({
  appointments,
  showPatient,
  showClinic,
  rescheduleHref,
  questionnaireHref,
  billHref,
  onAction,
  busyKey,
}: Props) {
  return (
    <Table.ScrollArea borderWidth="1px" rounded="md" bg="white">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>日付</Table.ColumnHeader>
            <Table.ColumnHeader>時間</Table.ColumnHeader>
            {showClinic ? <Table.ColumnHeader>医療機関</Table.ColumnHeader> : null}
            <Table.ColumnHeader>医師</Table.ColumnHeader>
            {showPatient ? <Table.ColumnHeader>患者</Table.ColumnHeader> : null}
            <Table.ColumnHeader>状態</Table.ColumnHeader>
            <Table.ColumnHeader>会計</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {appointments.map((each) => {
            const appointment = getFragmentData(AppointmentRow, each);
            const button = (action: RowAction, label: string, colorPalette?: string) => (
              <Button
                size="xs"
                variant={action === "cancel" ? "outline" : "solid"}
                colorPalette={colorPalette}
                loading={busyKey === `${action}:${appointment.id}`}
                disabled={busyKey !== null}
                onClick={() => onAction(action, appointment.id)}
              >
                {label}
              </Button>
            );
            return (
              <Table.Row key={appointment.id}>
                <Table.Cell whiteSpace="nowrap">{formatDate(appointment.slot.startsAt)}</Table.Cell>
                <Table.Cell whiteSpace="nowrap">
                  {formatTime(appointment.slot.startsAt)}〜{formatTime(appointment.slot.endsAt)}
                </Table.Cell>
                {showClinic ? <Table.Cell>{appointment.slot.clinic.name}</Table.Cell> : null}
                <Table.Cell>{appointment.slot.doctor.name}</Table.Cell>
                {showPatient ? (
                  <Table.Cell>
                    {appointment.patient.name}
                    {appointment.bookedByStaff ? (
                      <Text as="span" ms="2" fontSize="xs" color="gray.600">
                        （代理）
                      </Text>
                    ) : null}
                  </Table.Cell>
                ) : null}
                <Table.Cell>
                  <Badge colorPalette={STATUS_COLORS[appointment.status]}>
                    {STATUS_LABELS[appointment.status]}
                  </Badge>
                </Table.Cell>
                <Table.Cell whiteSpace="nowrap">
                  {appointment.bill ? (
                    <Link asChild colorPalette="blue">
                      <NextLink href={billHref(appointment.bill.id)}>
                        <Badge colorPalette={BILL_STATUS_COLORS[appointment.bill.status]}>
                          {BILL_STATUS_LABELS[appointment.bill.status]}
                        </Badge>
                        {appointment.bill.totalAmount !== null
                          ? formatYen(appointment.bill.totalAmount)
                          : "明細を入れる"}
                      </NextLink>
                    </Link>
                  ) : null}
                </Table.Cell>
                <Table.Cell textAlign="end">
                  <HStack justify="end" gap="2">
                    {/* 問診は、答えられる人（患者）には「答える・直す」、読めるだけの人（医師）には、答えがあるときだけ「見る」 */}
                    {appointment.canAnswerQuestionnaire ||
                    (appointment.canViewQuestionnaire && appointment.questionnaire) ? (
                      <Button size="xs" variant="outline" asChild>
                        <NextLink href={questionnaireHref(appointment.id)}>
                          {!appointment.canAnswerQuestionnaire
                            ? "問診を見る"
                            : appointment.questionnaire?.submitted
                              ? "問診を直す"
                              : "問診に答える"}
                        </NextLink>
                      </Button>
                    ) : null}
                    {appointment.canCheckIn ? button("checkIn", "受付する", "blue") : null}
                    {appointment.canStartConsultation ? button("start", "診察を始める", "blue") : null}
                    {appointment.canFinishConsultation ? button("finish", "診察を終える", "blue") : null}
                    {appointment.canCancel && appointment.status === "BOOKED" ? (
                      <Button size="xs" variant="outline" asChild>
                        <NextLink href={rescheduleHref(appointment.id, appointment.slot.clinic.id)}>
                          時刻を変える
                        </NextLink>
                      </Button>
                    ) : null}
                    {appointment.canCancel ? button("cancel", "キャンセル", "red") : null}
                  </HStack>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
