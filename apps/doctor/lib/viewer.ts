import { fetchGraphqlOnServer } from "@clinic/web-kit/server";
import { print } from "graphql";
import { redirect } from "next/navigation";
import type { MeQuery } from "@/lib/gql/graphql";
import { MeDocument, type Viewer } from "./viewer.graphql";

// サーバーの部品から、このアプリにログインしている人を Rails に聞く
export async function fetchViewer(): Promise<Viewer | null> {
  const data = await fetchGraphqlOnServer<MeQuery>("doctor", print(MeDocument));
  return data?.me ?? null;
}

// ログインしていなければ、ログインの画面へ送る。
// これは、画面を出し分けるためだけのもの。データを守るのは、Rails の側の認可
export async function requireViewer(): Promise<Viewer> {
  const viewer = await fetchViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
