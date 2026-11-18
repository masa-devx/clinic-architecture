"use client";

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import type { ReactNode } from "react";

// 見た目の決まり（テーマ）は、ここだけに書く
const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif" },
        body: { value: "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif" },
      },
    },
  },
  globalCss: {
    "html, body": { bg: "gray.50", color: "gray.900" },
  },
});

const system = createSystem(defaultConfig, config);

export function UiProvider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
