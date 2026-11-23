"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Flex, Table, Text } from "@chakra-ui/react";
import { PageHeader } from "@clinic/ui/page-header";
import { ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { StatusBadge } from "@clinic/ui/status-badge";
import { Surface } from "@clinic/ui/surface";
import { formatDateTime } from "@clinic/web-kit/datetime";
import { BILL_STATUS_COLORS, BILL_STATUS_LABELS, formatYen } from "@clinic/web-kit/labels";
import { BillDocument } from "../graphql/billing.generated";

// 会計の明細を見る画面（患者は、見るだけ）。見られるのは、医療機関が確定したあと
export function BillView({ billId }: { billId: string }) {
  const { data, loading, error } = useQuery(BillDocument, {
    variables: { id: billId },
    fetchPolicy: "cache-and-network",
  });

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return <ErrorMessage title="会計を読み込めませんでした" description="時間をおいて、開き直してください" />;
  if (!data) return null;
  if (!data.bill) return <ErrorMessage title="会計が見つかりません" />;

  const bill = data.bill;
  const { slot } = bill.appointment;
  return (
    <Box>
      <PageHeader
        title="会計"
        description={`${slot.clinic.name}・${formatDateTime(slot.startsAt)}・${slot.doctor.name} 医師`}
      />
      <Surface>
        <Flex justify="space-between" align="center" mb="4">
          <StatusBadge
            size="lg"
            label={BILL_STATUS_LABELS[bill.status]}
            color={BILL_STATUS_COLORS[bill.status]}
          />
          {bill.totalAmount !== null ? (
            <Text className="tabular" fontSize="2xl" fontWeight="bold">
              合計 {formatYen(bill.totalAmount)}
            </Text>
          ) : null}
        </Flex>
        <Table.Root size="md">
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
      </Surface>
    </Box>
  );
}
