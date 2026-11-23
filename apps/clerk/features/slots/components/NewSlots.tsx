"use client";

import { useMutation } from "@apollo/client/react";
import { CreateSlotsForm } from "@clinic/web-kit/staff/create-slots-form";
import { useViewer } from "@/lib/viewer-context";
import { CreateSlotsDocument } from "../graphql/slots.generated";

// 診療枠をまとめて作る。事務スタッフは、自院の医師の中から選ぶ
export function NewSlots() {
  const viewer = useViewer();
  const [createSlots] = useMutation(CreateSlotsDocument);

  return (
    <CreateSlotsForm
      doctors={viewer.clinic?.doctors ?? []}
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
