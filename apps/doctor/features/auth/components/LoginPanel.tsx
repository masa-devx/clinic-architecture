"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { LoginForm } from "@clinic/web-kit/login-form";
import { LoginDocument } from "../graphql/auth.generated";

// ログインの画面。見た目は3つのアプリで共通（web-kit）。送り先は、このアプリの入口
export function LoginPanel() {
  const client = useApolloClient();
  const [login] = useMutation(LoginDocument);

  return (
    <LoginForm
      title="医師のログイン"
      description="今日の診察と、問診を確かめる画面です"
      homePath="/appointments"
      login={async (values) => {
        const payload = (await login({ variables: values })).data?.login;
        const error = payload?.errors[0];
        if (error) return error.message;
        // 前にログインしていた人のデータがキャッシュに残らないように、空にする
        await client.clearStore();
        return null;
      }}
    />
  );
}
