"use client";

import { UiProvider } from "@clinic/ui/provider";
import { AppToaster } from "@clinic/ui/toaster";
import type { ReactNode } from "react";
import { ApolloClientProvider } from "@/lib/apollo/provider";
import { EmotionRegistry } from "@/lib/emotion-registry";

// ブラウザの側で動く土台（見た目のテーマ・Apollo Client・トースト）を、ここでまとめて包む
export function Providers({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <UiProvider>
        <ApolloClientProvider>{children}</ApolloClientProvider>
        <AppToaster />
      </UiProvider>
    </EmotionRegistry>
  );
}
