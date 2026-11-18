"use client";

import { ApolloProvider } from "@apollo/client/react";
import { notifyError } from "@clinic/ui/toaster";
import { useState, type ReactNode } from "react";
import { makeApolloClient } from "./client";

// ログインが切れていたら、今いる側（患者・スタッフ）のログインの画面へ送る
function goToLogin() {
  const login = window.location.pathname.startsWith("/staff") ? "/staff/login" : "/login";
  if (window.location.pathname !== login) window.location.assign(login);
}

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  // 描き直しのたびに作り直さないように、最初の1回だけ作る
  const [client] = useState(() => makeApolloClient({ onUnauthenticated: goToLogin, onFailure: notifyError }));
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
