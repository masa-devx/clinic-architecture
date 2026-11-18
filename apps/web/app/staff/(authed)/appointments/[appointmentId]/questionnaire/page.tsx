import { QuestionnairePage } from "@/features/questionnaire/QuestionnairePage";

export default async function Page({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return <QuestionnairePage appointmentId={appointmentId} donePath="/staff/appointments" />;
}
