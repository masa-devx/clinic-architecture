import { PageHeader } from "@clinic/ui/page-header";
import { CreateSlotsForm } from "@/features/slots/CreateSlotsForm";

export default function StaffSlotsPage() {
  return (
    <>
      <PageHeader title="診療枠を作る" description="曜日と時間帯から、期間の中の枠をまとめて作ります" />
      <CreateSlotsForm />
    </>
  );
}
