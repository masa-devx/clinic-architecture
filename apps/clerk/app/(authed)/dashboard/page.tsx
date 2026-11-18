import { PageHeader } from "@clinic/ui/page-header";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export default function Page() {
  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="日ごと・医師ごとの、予約の件数と売上（売上は、支払い済の会計の合計）"
      />
      <DashboardPage />
    </>
  );
}
