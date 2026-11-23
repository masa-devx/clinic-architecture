import type { ReactNode } from "react";
import { Shell } from "@/features/auth/components/Shell";
import { requireViewer } from "@/lib/viewer";
import { ViewerProvider } from "@/lib/viewer-context";

// ログインが要る画面の枠。サーバーで、事務スタッフとしてログインしているかを確かめる
export default async function AuthedLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer();
  return (
    <ViewerProvider viewer={viewer}>
      <Shell>{children}</Shell>
    </ViewerProvider>
  );
}
