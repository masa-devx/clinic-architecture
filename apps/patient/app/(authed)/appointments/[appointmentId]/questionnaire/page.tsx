import { QuestionnairePage } from "@/features/questionnaire/components/QuestionnairePage";

export default async function Page({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  return <QuestionnairePage appointmentId={appointmentId} />;
}
