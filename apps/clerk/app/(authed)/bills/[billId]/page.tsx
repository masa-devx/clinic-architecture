import { BillPage } from "@/features/billing/components/BillPage";

export default async function Page({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  return <BillPage billId={billId} />;
}
