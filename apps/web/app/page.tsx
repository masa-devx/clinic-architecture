import { redirect } from "next/navigation";
import { fetchViewer, homePathFor } from "@/lib/auth/fetch-viewer";

// 入口。ログインしていれば、その人の最初の画面へ。していなければ、ログインへ
export default async function RootPage() {
  const viewer = await fetchViewer();
  redirect(viewer ? homePathFor(viewer) : "/login");
}
