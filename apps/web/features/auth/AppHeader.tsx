"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { Box, Button, Container, Flex, HStack, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useViewer } from "@/lib/auth/viewer-context";
import { LogoutDocument } from "./auth.graphql";

type NavItem = { href: string; label: string };

const KIND_LABELS = { PATIENT: "患者", DOCTOR: "医師", CLERK: "事務スタッフ" } as const;

// 画面の上の帯。メニュー・ログインしている人・ログアウト
export function AppHeader({ items, loginPath }: { items: readonly NavItem[]; loginPath: string }) {
  const viewer = useViewer();
  const pathname = usePathname();
  const client = useApolloClient();
  const [logout, { loading }] = useMutation(LogoutDocument);

  const onLogout = async () => {
    try {
      await logout();
      await client.clearStore();
      window.location.assign(loginPath);
    } catch {
      // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
    }
  };

  return (
    <Box as="header" bg="white" borderBottomWidth="1px">
      <Container maxW="5xl" py="3">
        <Flex justify="space-between" align="center" gap="4" wrap="wrap">
          <HStack as="nav" gap="5" aria-label="メニュー">
            {items.map((item) => (
              <Link
                key={item.href}
                asChild
                fontWeight={pathname.startsWith(item.href) ? "bold" : "normal"}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              >
                <NextLink href={item.href}>{item.label}</NextLink>
              </Link>
            ))}
          </HStack>
          <HStack gap="3">
            <Text fontSize="sm" color="gray.600">
              {viewer.clinic ? `${viewer.clinic.name}・` : ""}
              {KIND_LABELS[viewer.kind]}：{viewer.name}
            </Text>
            <Button size="sm" variant="outline" onClick={onLogout} loading={loading}>
              ログアウト
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
