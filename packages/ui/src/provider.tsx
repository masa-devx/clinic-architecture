"use client";

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import type { ReactNode } from "react";

// 見た目の決まり（テーマ）は、ここだけに書く。3つの画面（患者・事務スタッフ・医師）で共通。
// 医療機関の画面で大事にすること:
//   - 落ち着いた色。主な色は青緑（teal）。赤は「取り消す・危ない」だけに使う
//   - 文字は大きめ。時刻と金額は、桁がそろう数字（tabular-nums）で出す
//   - 状態は、色だけでなく、必ず言葉でも出す（色の見え方に頼らない）
const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif" },
        body: { value: "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        // 画面の地の色・面の色・線の色
        "app.bg": { value: "#F3F6F8" },
        "app.surface": { value: "#FFFFFF" },
        "app.border": { value: "#DCE3E8" },
        "app.muted": { value: "#5B6B77" },
        // 主な色（ブランド）
        "app.brand": { value: "{colors.teal.700}" },
        "app.brandSubtle": { value: "{colors.teal.50}" },
      },
    },
  },
  globalCss: {
    "html, body": { bg: "app.bg", color: "gray.900", lineHeight: "1.7" },
    // 時刻・金額・件数は、桁がそろうようにする
    ".tabular": { fontVariantNumeric: "tabular-nums" },
  },
});

const system = createSystem(defaultConfig, config);

export function UiProvider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
