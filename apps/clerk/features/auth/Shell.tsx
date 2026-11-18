"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { AppShell } from "@clinic/web-kit/app-shell";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useViewer } from "@/lib/viewer-context";
import { LogoutDocument } from "./auth.graphql";

const NAV = [
  { href: "/appointments", label: "予約の一覧" },
  { href: "/slots", label: "空いている枠" },
  { href: "/slots/new", label: "診療枠を作る" },
  { href: "/dashboard", label: "ダッシュボード" },
];
// 監査ログは、見られる人（管理者）にだけ、メニューに出す。出さないのは、見た目のため。データを守るのは、Rails の側の認可
const ADMIN_NAV = [{ href: "/audit-logs", label: "監査ログ" }];

// 事務スタッフの画面の枠（左のメニュー・ログアウト）
export function Shell({ children }: { children: ReactNode }) {
  const viewer = useViewer();
  const router = useRouter();
  const client = useApolloClient();
  const [logout, { loading }] = useMutation(LogoutDocument);

  const onLogout = async () => {
    try {
      await logout();
      await client.clearStore();
      // ログインの画面へ移り、サーバーの部品（レイアウト）にも、ログインを確かめ直させる
      router.replace("/login");
      router.refresh();
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    }
  };

  return (
    <AppShell
      variant="sidebar"
      brand="受付・会計"
      context={viewer.clinic?.name}
      nav={[...NAV, ...(viewer.canViewAuditLogs ? ADMIN_NAV : [])]}
      userLabel={`事務スタッフ：${viewer.name}`}
      onLogout={onLogout}
      loggingOut={loading}
    >
      {children}
    </AppShell>
  );
}
