import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export type Audience = "patient" | "clerk" | "doctor";

// サーバーの部品から、Rails の GraphQL を呼ぶ。ブラウザが送ってきた Cookie を、そのまま渡す。
// 使うのは、ログインしている人を確かめるときだけ（画面を出し分けるため。データを守るのは、Rails の側の認可）
export async function fetchGraphqlOnServer<Data>(audience: Audience, query: string): Promise<Data | null> {
  const response = await fetch(`${API_URL}/graphql/${audience}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: (await cookies()).toString() },
    body: JSON.stringify({ query }),
    // 人ごとに違う答えなので、Next.js に覚えさせない
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`ログインの確認に失敗しました（${response.status}）`);

  const body = (await response.json()) as { data?: Data | null };
  return body.data ?? null;
}
