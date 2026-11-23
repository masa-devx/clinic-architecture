import { PageHeader } from "@clinic/ui/page-header";
import { MyAppointments } from "@/features/appointments/components/MyAppointments";

export default function MyAppointmentsPage() {
  return (
    <>
      <PageHeader title="自分の予約" />
      <MyAppointments />
    </>
  );
}
