import { PageHeader } from "@clinic/ui/page-header";
import { StaffAppointments } from "@/features/appointments/StaffAppointments";

export default function StaffAppointmentsPage() {
  return (
    <>
      <PageHeader title="予約の一覧" />
      <StaffAppointments />
    </>
  );
}
