import { NotFoundPage } from "@clinic/web-kit/error-pages";

// URL に合うページがないとき・notFound() を呼んだとき
export default function NotFound() {
  return <NotFoundPage />;
}
