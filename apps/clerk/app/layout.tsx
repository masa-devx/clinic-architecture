import { AppProviders } from "@clinic/web-kit/providers";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "受付・会計（学習用）",
  description: "架空のオンライン診療の画面。学習用で、実在のサービスではありません",
};

// 続きを読み込む一覧と、その一覧を分ける引数（絞り込み）
const PAGINATED = {
  appointments: ["filter", "descending"],
  availableSlots: ["doctorId", "from", "to"],
  auditLogs: [],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Chakra UI が、ブラウザで html に色の設定のクラスを足すので、その差の警告だけを抑える
    <html lang="ja" suppressHydrationWarning>
      <body>
        <AppProviders paginated={PAGINATED}>{children}</AppProviders>
      </body>
    </html>
  );
}
