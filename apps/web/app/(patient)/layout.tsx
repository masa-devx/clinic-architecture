import { Container } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { AppHeader } from "@/features/auth/AppHeader";
import { requireViewer } from "@/lib/auth/fetch-viewer";
import { ViewerProvider } from "@/lib/auth/viewer-context";

const NAV = [
  { href: "/appointments", label: "自分の予約" },
  { href: "/book", label: "予約する" },
];

// 患者の画面の枠。サーバーで、患者としてログインしているかを確かめる
export default async function PatientLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer(["PATIENT"], "/login");
  return (
    <ViewerProvider viewer={viewer}>
      <AppHeader items={NAV} loginPath="/login" />
      <Container as="main" maxW="5xl" py="8">
        {children}
      </Container>
    </ViewerProvider>
  );
}
