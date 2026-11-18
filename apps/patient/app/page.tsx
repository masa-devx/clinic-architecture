import { redirect } from "next/navigation";

// 入口。最初の画面へ送る（ログインしていなければ、その先のレイアウトが、ログインへ送る）
export default function RootPage() {
  redirect("/appointments");
}
