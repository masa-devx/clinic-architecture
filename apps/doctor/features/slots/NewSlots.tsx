"use client";

import { useMutation } from "@apollo/client/react";
import { CreateSlotsForm } from "@clinic/web-kit/staff/create-slots-form";
import { useViewer } from "@/lib/viewer-context";
import { CreateSlotsDocument } from "./slots.graphql";

// 診療枠をまとめて作る。医師が作れるのは、自分の枠だけ（選択肢は自分だけ）
export function NewSlots() {
  const viewer = useViewer();
  const [createSlots] = useMutation(CreateSlotsDocument);
  const doctors = viewer.staffMemberId ? [{ id: viewer.staffMemberId, name: viewer.name }] : [];

  return (
    <CreateSlotsForm
      doctors={doctors}
      onSubmit={async (values) => {
        try {
          const result = await createSlots({
            variables: { input: values },
            // 枠が増えたので、「空いている枠」のキャッシュを捨てて、次に開いたときに取り直させる
            update(cache, { data }) {
              if (data?.createSlots.createdCount) {
                cache.evict({ id: "ROOT_QUERY", fieldName: "availableSlots" });
                cache.gc();
              }
            },
          });
          return result.data?.createSlots ?? null;
        } catch {
          // 通信の失敗などは、Apollo の設定の1か所で知らせている
          return null;
        }
      }}
    />
  );
}
