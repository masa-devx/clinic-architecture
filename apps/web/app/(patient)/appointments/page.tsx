import { PageHeader } from "@clinic/ui/page-header";
import { MyAppointments } from "@/features/appointments/MyAppointments";

export default function MyAppointmentsPage() {
  return (
    <>
      <PageHeader title="自分の予約" />
      <MyAppointments />
    </>
  );
}
