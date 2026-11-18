"use client";

import { useViewer } from "@/lib/auth/viewer-context";
import { SlotPicker } from "./SlotPicker";

// スタッフの「空いている枠」。自院の枠を見て、閉じる・（事務スタッフなら）患者の代わりに予約を入れる・予約の時刻を変える
export function StaffSlotPicker() {
  const viewer = useViewer();
  if (!viewer.clinic) return null;

  return (
    <SlotPicker
      clinicId={viewer.clinic.id}
      mode="staff"
      canProxyBook={viewer.kind === "CLERK"}
      donePath="/staff/appointments"
    />
  );
}
