import { AppointmentDetail } from "@/features/appointments/components/AppointmentDetail";

export default async function Page({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return <AppointmentDetail appointmentId={appointmentId} />;
}
