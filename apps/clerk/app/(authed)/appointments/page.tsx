import { PageHeader } from "@clinic/ui/page-header";
import { AppointmentsPage } from "@/features/appointments/AppointmentsPage";

export default function Page() {
  return (
    <>
      <PageHeader title="予約の一覧" description="自院の予約。開いたときは、今日からの予約が出ます" />
      <AppointmentsPage />
    </>
  );
}
