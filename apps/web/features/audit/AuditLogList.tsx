"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Button, Center, Table } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { useState } from "react";
import { formatDateTime } from "@/lib/datetime";
import { AuditLogsDocument } from "./audit.graphql";
import { ACTION_LABELS, KIND_LABELS } from "./labels";

// 監査ログ（誰が・いつ・どの患者の・何を見たか、変えたか）を、新しい順に出す。見るだけで、変える操作はない
export function AuditLogList() {
  const { data, loading, error, fetchMore } = useQuery(AuditLogsDocument, {
    fetchPolicy: "cache-and-network",
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const onLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchMore({ variables: { after: data?.auditLogs.pageInfo.endCursor } });
    } catch {
      // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
    } finally {
      setLoadingMore(false);
    }
  };

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return (
      <ErrorMessage title="監査ログを読み込めませんでした" description="時間をおいて、開き直してください" />
    );
  if (!data) return null;

  const logs = data.auditLogs.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
  // 見られない人（管理者でない人）にも、空で返る
  if (logs.length === 0)
    return (
      <EmptyMessage title="監査ログは、ありません" description="見られるのは、管理者の事務スタッフだけです" />
    );

  return (
    <Box>
      <Table.ScrollArea borderWidth="1px" rounded="md" bg="white">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>いつ</Table.ColumnHeader>
              <Table.ColumnHeader>誰が</Table.ColumnHeader>
              <Table.ColumnHeader>どの患者の</Table.ColumnHeader>
              <Table.ColumnHeader>何を</Table.ColumnHeader>
              <Table.ColumnHeader>どうした</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {logs.map((log) => (
              <Table.Row key={log.id}>
                <Table.Cell whiteSpace="nowrap">{formatDateTime(log.occurredAt)}</Table.Cell>
                <Table.Cell>
                  {log.actorName}
                  {/* システム（定期の処理）がしたことには、人の種類がない */}
                  {log.actorKind ? `（${KIND_LABELS[log.actorKind]}）` : ""}
                </Table.Cell>
                <Table.Cell>{log.patientName}</Table.Cell>
                <Table.Cell whiteSpace="nowrap">{log.subject}</Table.Cell>
                <Table.Cell>{ACTION_LABELS[log.action]}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      {data.auditLogs.pageInfo.hasNextPage ? (
        <Center mt="4">
          <Button variant="outline" onClick={onLoadMore} loading={loadingMore}>
            続きを読み込む
          </Button>
        </Center>
      ) : null}
    </Box>
  );
}
