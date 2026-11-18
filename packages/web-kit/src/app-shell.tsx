"use client";

import { SidebarShell, TopBarShell, type NavItem } from "@clinic/ui/shell";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  // topbar: 患者の画面 ／ sidebar: スタッフの画面
  variant: "topbar" | "sidebar";
  brand: string;
  context?: string;
  nav: readonly { href: string; label: string }[];
  userLabel: string;
  onLogout: () => void;
  loggingOut: boolean;
  children: ReactNode;
};

// 画面の枠（packages/ui）に、Next.js のリンクと「今どのページか」をつなぐ
export function AppShell({ variant, nav, children, ...rest }: Props) {
  const pathname = usePathname();
  // いちばん長く一致するメニューを、今のページとする（/slots と /slots/new を区別する）
  const current = nav
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const items: NavItem[] = nav.map((item) => ({ ...item, active: item.href === current?.href }));
  const Shell = variant === "topbar" ? TopBarShell : SidebarShell;

  return (
    <Shell {...rest} nav={items} renderLink={(item, label) => <NextLink href={item.href}>{label}</NextLink>}>
      {children}
    </Shell>
  );
}
