"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Center } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { notifyError, notifySuccess } from "@clinic/ui/toaster";
import { SlotRows } from "@clinic/web-kit/staff/slot-rows";
import { useState } from "react";
import { useViewer } from "@/lib/viewer-context";
import { CloseSlotDocument, OwnSlotsDocument } from "../graphql/slots.generated";

// 自分の空いている枠。予約の入っていない枠を閉じられる
export function OwnSlots() {
  const viewer = useViewer();
  const { data, loading, error, fetchMore, refetch } = useQuery(OwnSlotsDocument, {
    variables: { doctorId: viewer.staffMemberId },
    fetchPolicy: "cache-and-network",
  });
  const [closeSlot] = useMutation(CloseSlotDocument);
  const [loadingMore, setLoadingMore] = useState(false);

  const onClose = async (slotId: string) => {
    try {
      const result = await closeSlot({ variables: { slotId } });
      const userError = result.data?.closeSlot.errors[0];
      if (userError) notifyError(userError.message);
      else notifySuccess("枠を閉じました");
      // 閉じた枠（閉じられなかったなら、予約が入った枠）を、一覧から消す
      await refetch();
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    }
  };

  const onLoadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchMore({ variables: { after: data?.availableSlots.pageInfo.endCursor } });
    } catch {
      // 同上
    } finally {
      setLoadingMore(false);
    }
  };

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return (
      <ErrorMessage
        title="空いている枠を読み込めませんでした"
        description="時間をおいて、開き直してください"
      />
    );
  if (!data) return null;

  const slots = data.availableSlots.edges?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? [];
  if (slots.length === 0)
    return <EmptyMessage title="空いている枠はありません" description="「診療枠を作る」から、枠を足せます" />;

  return (
    <Box>
      <SlotRows slots={slots} onClose={onClose} busyId={null} />
      {data.availableSlots.pageInfo.hasNextPage ? (
        <Center mt="5">
          <Button variant="outline" onClick={onLoadMore} loading={loadingMore}>
            続きを読み込む
          </Button>
        </Center>
      ) : null}
    </Box>
  );
}
