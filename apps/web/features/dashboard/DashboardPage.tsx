"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Field, HStack, Input, Table } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatYen } from "@/lib/bill-status";
import { formatDate, toDateInTokyo } from "@/lib/datetime";
import { DashboardDocument } from "./dashboard.graphql";
import { cancelRate, rangeFrom, totalOf } from "./summary";

// 日ごと・医師ごとの、予約の件数・キャンセルの割合・売上。期間は URL に置く（リロードしても、URL を渡しても、同じ表になる）
export function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 「今日」は、画面を開いたときに1回だけ決める
  const [today] = useState(() => toDateInTokyo(new Date()));
  const range = rangeFrom(searchParams, today);

  const { data, loading, error } = useQuery(DashboardDocument, {
    variables: { from: range.from, to: range.to },
    fetchPolicy: "cache-and-network",
    // 期間が正しくないあいだは、集計を頼まない
    skip: range.error !== null,
  });

  const setRange = (key: "from" | "to", value: string) => {
    const params = new URLSearchParams({ from: range.from, to: range.to });
    if (value) params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const rows = data?.dashboard ?? [];
  const total = totalOf(rows);

  return (
    <Box>
      <HStack
        as="form"
        gap="4"
        mb="5"
        align="end"
        aria-label="期間"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field.Root width="auto">
          <Field.Label>この日から</Field.Label>
          <Input
            type="date"
            bg="white"
            value={range.from}
            onChange={(event) => setRange("from", event.target.value)}
          />
        </Field.Root>
        <Field.Root width="auto">
          <Field.Label>この日まで</Field.Label>
          <Input
            type="date"
            bg="white"
            value={range.to}
            onChange={(event) => setRange("to", event.target.value)}
          />
        </Field.Root>
      </HStack>
      {range.error ? (
        <ErrorMessage title={range.error} />
      ) : !data && loading ? (
        <LoadingMessage />
      ) : !data && error ? (
        <ErrorMessage title="集計を読み込めませんでした" description="時間をおいて、開き直してください" />
      ) : rows.length === 0 ? (
        <EmptyMessage title="この期間の予約は、ありません" />
      ) : (
        <Table.ScrollArea borderWidth="1px" rounded="md" bg="white">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>日付</Table.ColumnHeader>
                <Table.ColumnHeader>医師</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">予約</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">診察済</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">キャンセル</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">無断キャンセル</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">キャンセルの割合</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">売上</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row key={`${row.date}-${row.doctor.id}`}>
                  {/* 日付だけの値は、日本時間の0時として読ませる */}
                  <Table.Cell whiteSpace="nowrap">{formatDate(`${row.date}T00:00:00+09:00`)}</Table.Cell>
                  <Table.Cell>{row.doctor.name}</Table.Cell>
                  <Table.Cell textAlign="end">{row.total}</Table.Cell>
                  <Table.Cell textAlign="end">{row.completed}</Table.Cell>
                  <Table.Cell textAlign="end">{row.canceled}</Table.Cell>
                  <Table.Cell textAlign="end">{row.noShow}</Table.Cell>
                  <Table.Cell textAlign="end">{cancelRate(row)}</Table.Cell>
                  <Table.Cell textAlign="end">{formatYen(row.revenue)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
            <Table.Footer>
              <Table.Row fontWeight="bold">
                <Table.Cell colSpan={2}>合計</Table.Cell>
                <Table.Cell textAlign="end">{total.total}</Table.Cell>
                <Table.Cell textAlign="end">{total.completed}</Table.Cell>
                <Table.Cell textAlign="end">{total.canceled}</Table.Cell>
                <Table.Cell textAlign="end">{total.noShow}</Table.Cell>
                <Table.Cell textAlign="end">{cancelRate(total)}</Table.Cell>
                <Table.Cell textAlign="end">{formatYen(total.revenue)}</Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </Table.ScrollArea>
      )}
    </Box>
  );
}
