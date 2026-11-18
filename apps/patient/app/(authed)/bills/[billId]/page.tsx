import { BillView } from "@/features/billing/BillView";

export default async function Page({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  return <BillView billId={billId} />;
}
