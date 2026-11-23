"use client";

import { ErrorPage } from "@clinic/web-kit/error-pages";

// 画面を描いている途中でエラーが起きたとき（ログインの確認のレイアウトを含む）。
// 通信の失敗（GraphQL の errors）は、ここには来ない。Apollo の設定の1か所で、知らせ（トースト）として出す
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} reset={reset} />;
}
