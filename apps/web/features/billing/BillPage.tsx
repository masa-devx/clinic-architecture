"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Badge, Box, Button, HStack, Heading, Input, Stack, Table, Text } from "@chakra-ui/react";
import { PageHeader } from "@clinic/ui/page-header";
import { ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { notifyError, notifySuccess } from "@clinic/ui/toaster";
import { useState } from "react";
import { BILL_STATUS_COLORS, BILL_STATUS_LABELS, formatYen } from "@/lib/bill-status";
import { formatDateTime } from "@/lib/datetime";
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

// 会計の画面。事務スタッフは、明細を入れて確定し、支払い済・返金済にする。患者は、確定した会計を見るだけ。
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

  const run = async (step: Step, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(step);
    try {
      const userError = await send(step);
      if (userError) return notifyError(userError.message);
      // 保存できたら、入力中の値を捨てて、サーバーから返ってきた明細を出す
      if (step === "save") setEdited(null);
      notifySuccess(DONE[step]);
    } catch {
      // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
    } finally {
      setBusy(null);
    }
  };

  return (
    <Stack gap="6" maxW="2xl">
      <Box>
        <PageHeader
          title="会計"
          description={`${slot.clinic.name}・${formatDateTime(slot.startsAt)}・${slot.doctor.name}・${patient.name} さま`}
        />
        <HStack gap="3">
          <Badge colorPalette={BILL_STATUS_COLORS[bill.status]} size="lg">
            {BILL_STATUS_LABELS[bill.status]}
          </Badge>
          {bill.totalAmount !== null ? (
            <Text fontSize="xl" fontWeight="bold">
              合計 {formatYen(bill.totalAmount)}
            </Text>
          ) : null}
        </HStack>
      </Box>

      {editing ? (
        <Box as="section" aria-label="明細を入れる">
          <Heading as="h2" size="md" mb="2">
            明細を入れる
          </Heading>
          <Table.Root size="sm" bg="white" borderWidth="1px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>項目</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">単価</Table.ColumnHeader>
                <Table.ColumnHeader width="28">数量</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
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
          <HStack mt="3" justify="space-between">
            <Text color="gray.600">
              入力中の合計（目安）: {formatYen(draftTotal(data.feeItems, quantities))}
            </Text>
            <Button
              colorPalette="blue"
              variant="outline"
              loading={busy === "save"}
              disabled={busy !== null}
              onClick={() => run("save")}
            >
              明細を保存する
            </Button>
          </HStack>
        </Box>
      ) : null}

      <Box as="section" aria-label="明細">
        <Heading as="h2" size="md" mb="2">
          {editing ? "保存してある明細" : "明細"}
        </Heading>
        {bill.items.length === 0 ? (
          <Text color="gray.600">まだ明細がありません</Text>
        ) : (
          <Table.Root size="sm" bg="white" borderWidth="1px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>項目</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">単価</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">数量</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">金額</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
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
      </Box>

      {bill.canManage ? (
        <HStack gap="3">
          {bill.status === "DRAFT" ? (
            <Button
              colorPalette="blue"
              loading={busy === "confirm"}
              // 入力中の値が残っているあいだは、確定させない（確定されるのは、保存してある明細）
              disabled={busy !== null || edited !== null || bill.items.length === 0}
              onClick={() =>
                run("confirm", "保存してある明細で、会計を確定しますか？（確定したあとは、変えられません）")
              }
            >
              会計を確定する
            </Button>
          ) : null}
          {bill.status === "BILLED" ? (
            <Button
              colorPalette="green"
              loading={busy === "pay"}
              disabled={busy !== null}
              onClick={() => run("pay")}
            >
              支払い済にする
            </Button>
          ) : null}
          {bill.status === "PAID" ? (
            <Button
              colorPalette="red"
              variant="outline"
              loading={busy === "refund"}
              disabled={busy !== null}
              onClick={() => run("refund", "全額を返金済にしますか？")}
            >
              返金済にする
            </Button>
          ) : null}
        </HStack>
      ) : null}
    </Stack>
  );
}
