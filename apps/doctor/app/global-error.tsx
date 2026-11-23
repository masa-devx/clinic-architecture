"use client";

// いちばん外のレイアウト（テーマ・Apollo Client の土台）そのものが壊れたとき。
// 土台が使えないので、Chakra UI を使わずに、最小の HTML だけで出す
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "sans-serif", textAlign: "center", padding: "15vh 16px" }}>
        <h1 style={{ fontSize: "1.4rem" }}>画面を表示できませんでした</h1>
        <p>時間をおいて、開き直してください。</p>
        {error.digest ? (
          <p style={{ fontSize: "0.85rem" }}>問い合わせのときは、この番号を伝えてください：{error.digest}</p>
        ) : null}
        <button type="button" onClick={reset} style={{ padding: "8px 16px", fontSize: "1rem" }}>
          もう一度試す
        </button>
      </body>
    </html>
  );
}
