"use client";

import { ApolloProvider } from "@apollo/client/react";
import { UiProvider } from "@clinic/ui/provider";
import { AppToaster, notifyError } from "@clinic/ui/toaster";
import { useState, type ReactNode } from "react";
import { makeApolloClient, type PaginatedFields } from "./apollo";
import { EmotionRegistry } from "./emotion-registry";

// ブラウザの側で動く土台（見た目のテーマ・Apollo Client・トースト）を、まとめて包む。3つのアプリで同じ
export function AppProviders({ paginated, children }: { paginated: PaginatedFields; children: ReactNode }) {
  // 描き直しのたびに作り直さないように、最初の1回だけ作る
  const [client] = useState(() =>
    makeApolloClient(
      {
        // ログインが切れていたら、ログインの画面へ送る
        onUnauthenticated: () => {
          if (window.location.pathname !== "/login") window.location.assign("/login");
        },
        onFailure: notifyError,
      },
      paginated,
    ),
  );

  return (
    <EmotionRegistry>
      <UiProvider>
        <ApolloProvider client={client}>{children}</ApolloProvider>
        <AppToaster />
      </UiProvider>
    </EmotionRegistry>
  );
}
