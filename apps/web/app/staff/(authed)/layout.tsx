import { Container } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { AppHeader } from "@/features/auth/AppHeader";
import { requireViewer } from "@/lib/auth/fetch-viewer";
import { ViewerProvider } from "@/lib/auth/viewer-context";

const NAV = [
  { href: "/staff/appointments", label: "予約の一覧" },
  { href: "/staff/book", label: "空いている枠" },
  { href: "/staff/slots", label: "診療枠を作る" },
];
// 見られる人にだけ、メニューに出す。出さないのは、見た目のため。データを守るのは、Rails の側の認可
const CLERK_NAV = [{ href: "/staff/dashboard", label: "ダッシュボード" }];
const ADMIN_NAV = [{ href: "/staff/audit-logs", label: "監査ログ" }];

// スタッフの画面の枠。サーバーで、医師か事務スタッフとしてログインしているかを確かめる
export default async function StaffLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer(["DOCTOR", "CLERK"], "/staff/login");
  return (
    <ViewerProvider viewer={viewer}>
      <AppHeader
        items={[
          ...NAV,
          ...(viewer.kind === "CLERK" ? CLERK_NAV : []),
          ...(viewer.canViewAuditLogs ? ADMIN_NAV : []),
        ]}
        loginPath="/staff/login"
      />
      <Container as="main" maxW="5xl" py="8">
        {children}
      </Container>
    </ViewerProvider>
  );
}
