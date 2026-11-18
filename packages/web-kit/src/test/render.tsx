import { ApolloProvider } from "@apollo/client/react";
import { UiProvider } from "@clinic/ui/provider";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { makeApolloClient, type PaginatedFields } from "../apollo";

// 部品を、本物と同じ土台（テーマ・Apollo Client の設定）で包んで描く。通信だけを MSW で偽物にする
export function renderWithProviders(ui: ReactElement, paginated: PaginatedFields = {}) {
  const failures: string[] = [];
  const client = makeApolloClient(
    {
      onUnauthenticated: () => failures.push("UNAUTHENTICATED"),
      onFailure: (message) => failures.push(message),
    },
    paginated,
    "http://localhost/graphql",
  );
  const view = render(
    <UiProvider>
      <ApolloProvider client={client}>{ui}</ApolloProvider>
    </UiProvider>,
  );
  return { ...view, client, failures };
}
