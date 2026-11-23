import { SlotPicker } from "@/features/booking/components/SlotPicker";

export default async function BookClinicPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  return <SlotPicker clinicId={clinicId} />;
}
