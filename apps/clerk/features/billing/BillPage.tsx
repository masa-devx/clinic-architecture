"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Flex, HStack, Heading, Input, Stack, Table, Text } from "@chakra-ui/react";
import { ConfirmButton } from "@clinic/ui/confirm-button";
import { PageHeader } from "@clinic/ui/page-header";
import { ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { StatusBadge } from "@clinic/ui/status-badge";
import { Surface } from "@clinic/ui/surface";
import { notifyError, notifySuccess } from "@clinic/ui/toaster";
import { formatDateTime } from "@clinic/web-kit/datetime";
import { BILL_STATUS_COLORS, BILL_STATUS_LABELS, formatYen } from "@clinic/web-kit/labels";
import { useState } from "react";
import { getFragmentData } from "@/lib/gql";
import { draftTotal, quantitiesFrom, toInput, type Quantities } from "./bill-items";
import {
  BillDetail,
  BillDocument,
  ConfirmBillDocument,
  MarkBillPaidDocument,
  RefundBillDocument,
  UpdateBillItemsDocument,
} from "./billing.graphql";

type Step = "save" | "confirm" | "pay" | "refund";

const DONE: Record<Step, string> = {
  save: "明細を保存しました",
  confirm: "会計を確定しました",
  pay: "支払い済にしました",
  refund: "返金済にしました",
};

// 会計の画面。明細を入れて確定し、支払い済・返金済にする。
// 何ができるかは、サーバーが返す canManage と状態で決める
export function BillPage({ billId }: { billId: string }) {
  const { data, loading, error } = useQuery(BillDocument, {
    variables: { id: billId },
    fetchPolicy: "cache-and-network",
  });
  const [updateItems] = useMutation(UpdateBillItemsDocument);
  const [confirmBill] = useMutation(ConfirmBillDocument);
  const [markPaid] = useMutation(MarkBillPaidDocument);
  const [refundBill] = useMutation(RefundBillDocument);
  const [busy, setBusy] = useState<Step | null>(null);
  // 入力中の数量。null のあいだは、保存してある明細から作った値を出す（サーバーの値を、state に写して持たない）
  const [edited, setEdited] = useState<Quantities | null>(null);

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return <ErrorMessage title="会計を読み込めませんでした" description="時間をおいて、開き直してください" />;
  if (!data) return null;
  if (!data.bill) return <ErrorMessage title="会計が見つかりません" />;

  const bill = getFragmentData(BillDetail, data.bill);
  const { slot, patient } = bill.appointment;
  const editing = bill.canManage && bill.status === "DRAFT";
  const quantities = edited ?? quantitiesFrom(data.feeItems, bill.items);

  const send = async (step: Step) => {
    const variables = { billId: bill.id };
    switch (step) {
      case "save":
        return (await updateItems({ variables: { ...variables, items: toInput(quantities) } })).data
          ?.updateBillItems.errors[0];
      case "confirm":
        return (await confirmBill({ variables })).data?.confirmBill.errors[0];
      case "pay":
        return (await markPaid({ variables })).data?.markBillPaid.errors[0];
      case "refund":
        return (await refundBill({ variables })).data?.refundBill.errors[0];
    }
  };

  const run = async (step: Step) => {
    setBusy(step);
    try {
      const userError = await send(step);
      if (userError) return notifyError(userError.message);
      // 保存できたら、入力中の値を捨てて、サーバーから返ってきた明細を出す
      if (step === "save") setEdited(null);
      notifySuccess(DONE[step]);
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box maxW="3xl">
      <PageHeader
        title="会計"
        description={`${patient.name} さま・${formatDateTime(slot.startsAt)}・${slot.doctor.name} 医師`}
      />
      <Stack gap="5">
        <Surface>
          <Flex justify="space-between" align="center" gap="4" wrap="wrap">
            <StatusBadge
              size="lg"
              label={BILL_STATUS_LABELS[bill.status]}
              color={BILL_STATUS_COLORS[bill.status]}
            />
            {bill.totalAmount !== null ? (
              <Text className="tabular" fontSize="2xl" fontWeight="bold">
                合計 {formatYen(bill.totalAmount)}
              </Text>
            ) : (
              <Text color="app.muted">合計は、確定のときに決まります</Text>
            )}
          </Flex>
        </Surface>

        {editing ? (
          <Surface as="section" aria-label="明細を入れる">
            <Heading as="h2" size="md" mb="3">
              明細を入れる
            </Heading>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>項目</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">単価</Table.ColumnHeader>
                  <Table.ColumnHeader width="28">数量</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body className="tabular">
                {data.feeItems.map((feeItem) => (
                  <Table.Row key={feeItem.id}>
                    <Table.Cell>{feeItem.name}</Table.Cell>
                    <Table.Cell textAlign="end">{formatYen(feeItem.unitPrice)}</Table.Cell>
                    <Table.Cell>
                      <Input
                        type="number"
                        size="sm"
                        min={0}
                        max={99}
                        aria-label={`${feeItem.name} の数量`}
                        value={quantities[feeItem.id] || ""}
                        onChange={(event) =>
                          setEdited({ ...quantities, [feeItem.id]: event.target.valueAsNumber })
                        }
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
            <HStack mt="4" justify="space-between" wrap="wrap">
              <Text color="app.muted" className="tabular">
                入力中の合計（目安）: {formatYen(draftTotal(data.feeItems, quantities))}
              </Text>
              <Button
                colorPalette="teal"
                variant="outline"
                loading={busy === "save"}
                disabled={busy !== null}
                onClick={() => run("save")}
              >
                明細を保存する
              </Button>
            </HStack>
          </Surface>
        ) : null}

        <Surface as="section" aria-label="明細">
          <Heading as="h2" size="md" mb="3">
            {editing ? "保存してある明細" : "明細"}
          </Heading>
          {bill.items.length === 0 ? (
            <Text color="app.muted">まだ明細がありません</Text>
          ) : (
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>項目</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">単価</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">数量</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">金額</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body className="tabular">
                {bill.items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>{item.name}</Table.Cell>
                    <Table.Cell textAlign="end">{formatYen(item.unitPrice)}</Table.Cell>
                    <Table.Cell textAlign="end">{item.quantity}</Table.Cell>
                    <Table.Cell textAlign="end">{formatYen(item.amount)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Surface>

        {bill.canManage ? (
          <HStack gap="3">
            {bill.status === "DRAFT" ? (
              <ConfirmButton
                colorPalette="teal"
                size="lg"
                // 入力中の値が残っているあいだは、確定させない（確定されるのは、保存してある明細）
                disabled={busy !== null || edited !== null || bill.items.length === 0}
                title="この明細で、会計を確定しますか？"
                description="確定したあとは、明細を変えられません。"
                confirmLabel="確定する"
                onConfirm={() => run("confirm")}
              >
                会計を確定する
              </ConfirmButton>
            ) : null}
            {bill.status === "BILLED" ? (
              <Button
                colorPalette="green"
                size="lg"
                loading={busy === "pay"}
                disabled={busy !== null}
                onClick={() => run("pay")}
              >
                支払い済にする
              </Button>
            ) : null}
            {bill.status === "PAID" ? (
              <ConfirmButton
                variant="outline"
                colorPalette="red"
                size="lg"
                disabled={busy !== null}
                title="全額を返金済にしますか？"
                description={
                  bill.totalAmount !== null ? `返金する金額: ${formatYen(bill.totalAmount)}` : undefined
                }
                confirmLabel="返金済にする"
                danger
                onConfirm={() => run("refund")}
              >
                返金済にする
              </ConfirmButton>
            ) : null}
          </HStack>
        ) : null}
      </Stack>
    </Box>
  );
}
