import { addTypenameToDocument } from "@apollo/client/utilities";
import { fetchGraphqlOnServer } from "@clinic/web-kit/server";
import { print } from "graphql";
import { redirect } from "next/navigation";
import { MeDocument, type MeQuery } from "./graphql/viewer.generated";

// ログインしている人
export type Viewer = NonNullable<MeQuery["me"]>;

// サーバーの部品から、このアプリにログインしている人を Rails に聞く。
// 生成した型は、Apollo Client と同じく __typename があるものとして作っている。ここは Apollo Client を通らないので、送るクエリに __typename を足す
export async function fetchViewer(): Promise<Viewer | null> {
  const data = await fetchGraphqlOnServer<MeQuery>("patient", print(addTypenameToDocument(MeDocument)));
  return data?.me ?? null;
}

// ログインしていなければ、ログインの画面へ送る。
// これは、画面を出し分けるためだけのもの。データを守るのは、Rails の側の認可
export async function requireViewer(): Promise<Viewer> {
  const viewer = await fetchViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
