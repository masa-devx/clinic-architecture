import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "オンライン診療の予約（学習用）",
  description: "架空のオンライン診療の予約。学習用で、実在のサービスではありません",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Chakra UI が、ブラウザで html に色の設定のクラスを足すので、その差の警告だけを抑える
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
