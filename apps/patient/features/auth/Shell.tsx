"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { AppShell } from "@clinic/web-kit/app-shell";
import type { ReactNode } from "react";
import { useViewer } from "@/lib/viewer-context";
import { LogoutDocument } from "./auth.graphql";

const NAV = [
  { href: "/appointments", label: "自分の予約" },
  { href: "/book", label: "予約する" },
];

// 患者の画面の枠（上の帯・メニュー・ログアウト）
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
      variant="topbar"
      brand="オンライン診療の予約"
      nav={NAV}
      userLabel={`${viewer.name} さま`}
      onLogout={onLogout}
      loggingOut={loading}
    >
      {children}
    </AppShell>
  );
}
