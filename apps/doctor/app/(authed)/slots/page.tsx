import { PageHeader } from "@clinic/ui/page-header";
import { OwnSlots } from "@/features/slots/components/OwnSlots";

export default function Page() {
  return (
    <>
      <PageHeader title="自分の空き枠" description="予約の入っていない枠を、閉じられます" />
      <OwnSlots />
    </>
  );
}
