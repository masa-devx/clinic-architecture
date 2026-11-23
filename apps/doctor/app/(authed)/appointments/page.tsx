import { PageHeader } from "@clinic/ui/page-header";
import { SchedulePage } from "@/features/appointments/components/SchedulePage";

export default function Page() {
  return (
    <>
      <PageHeader
        title="診察の予定"
        description="自分が担当の予約。受付済になった予約から、診察を始められます"
      />
      <SchedulePage />
    </>
  );
}
