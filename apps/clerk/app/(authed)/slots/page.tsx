import { PageHeader } from "@clinic/ui/page-header";
import { SlotsPage } from "@/features/slots/components/SlotsPage";

export default async function Page({ searchParams }: { searchParams: Promise<{ reschedule?: string }> }) {
  const { reschedule } = await searchParams;
  return (
    <>
      <PageHeader
        title={reschedule ? "予約の時刻を変える" : "空いている枠"}
        description={
          reschedule
            ? "空いている枠から、新しい時間を選んでください"
            : "枠を閉じる・患者さまの代わりに予約を入れる（電話での予約など）"
        }
      />
      <SlotsPage />
    </>
  );
}
