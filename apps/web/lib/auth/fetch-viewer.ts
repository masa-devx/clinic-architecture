import { print } from "graphql";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ViewerKind } from "@/lib/gql/graphql";
import { MeDocument, type Viewer } from "./viewer.graphql";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

// サーバーの部品から、ログインしている人を Rails に聞く。ブラウザが送ってきた Cookie を、そのまま渡す
export async function fetchViewer(): Promise<Viewer | null> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: (await cookies()).toString() },
    body: JSON.stringify({ query: print(MeDocument) }),
    // 人ごとに違う答えなので、Next.js に覚えさせない
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`ログインの確認に失敗しました（${response.status}）`);

  const body = (await response.json()) as { data?: { me: Viewer | null } };
  return body.data?.me ?? null;
}

// その画面を見られる種類の人でなければ、ログインの画面へ送る。
// これは、画面を出し分けるためだけのもの。データを守るのは、Rails の側の認可
export async function requireViewer(kinds: readonly ViewerKind[], loginPath: string): Promise<Viewer> {
  const viewer = await fetchViewer();
  if (!viewer || !kinds.includes(viewer.kind)) redirect(loginPath);
  return viewer;
}

export function homePathFor(viewer: Viewer): string {
  return viewer.kind === "PATIENT" ? "/appointments" : "/staff/appointments";
}
