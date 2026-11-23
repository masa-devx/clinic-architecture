import { BillView } from "@/features/billing/components/BillView";

export default async function Page({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  return <BillView billId={billId} />;
}
