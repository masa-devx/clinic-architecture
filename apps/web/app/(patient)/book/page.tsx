import { PageHeader } from "@clinic/ui/page-header";
import { ClinicList } from "@/features/booking/ClinicList";

export default function BookPage() {
  return (
    <>
      <PageHeader title="予約する" description="医療機関を選んでください" />
      <ClinicList />
    </>
  );
}
