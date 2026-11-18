import { PageHeader } from "@clinic/ui/page-header";
import { AuditLogList } from "@/features/audit/AuditLogList";

export default function AuditLogsPage() {
  return (
    <>
      <PageHeader title="監査ログ" description="誰が・いつ・どの患者の・何を見たか、変えたか（新しい順）" />
      <AuditLogList />
    </>
  );
}
