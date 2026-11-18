"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { AppShell } from "@clinic/web-kit/app-shell";
import type { ReactNode } from "react";
import { useViewer } from "@/lib/viewer-context";
import { LogoutDocument } from "./auth.graphql";

const NAV = [
  { href: "/appointments", label: "診察の予定" },
  { href: "/slots", label: "自分の空き枠" },
  { href: "/slots/new", label: "診療枠を作る" },
];

// 医師の画面の枠（左のメニュー・ログアウト）
export function Shell({ children }: { children: ReactNode }) {
  const viewer = useViewer();
  const client = useApolloClient();
  const [logout, { loading }] = useMutation(LogoutDocument);

  const onLogout = async () => {
    try {
      await logout();
      await client.clearStore();
      window.location.assign("/login");
    } catch {
      // 通信の失敗などは、Apollo の設定の1か所で知らせている
    }
  };

  return (
    <AppShell
      variant="sidebar"
      brand="診察"
      context={viewer.clinic?.name}
      nav={NAV}
      userLabel={`${viewer.name} 医師`}
      onLogout={onLogout}
      loggingOut={loading}
    >
      {children}
    </AppShell>
  );
}
