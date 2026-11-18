"use client";

import { Box, Button, Container, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; active: boolean };

type Props = {
  // 画面の名前（例: 「オンライン診療の予約」）と、その下の小さな説明（例: 医療機関の名前）
  brand: string;
  context?: string;
  nav: readonly NavItem[];
  // リンクの描き方は、使う側が決める（Next.js のリンクなど）。この部品は、枠組みに依存しない
  renderLink: (item: NavItem, children: ReactNode) => ReactNode;
  // 右上に出す、ログインしている人の名前
  userLabel: string;
  onLogout: () => void;
  loggingOut: boolean;
  children: ReactNode;
};

function Brand({ brand, context }: { brand: string; context?: string }) {
  return (
    <Box>
      <Text fontWeight="bold" color="app.brand" lineHeight="1.3">
        {brand}
      </Text>
      {context ? (
        <Text fontSize="xs" color="app.muted">
          {context}
        </Text>
      ) : null}
    </Box>
  );
}

function UserArea({ userLabel, onLogout, loggingOut }: Pick<Props, "userLabel" | "onLogout" | "loggingOut">) {
  return (
    <HStack gap="3">
      <Text fontSize="sm" color="app.muted">
        {userLabel}
      </Text>
      <Button size="sm" variant="outline" onClick={onLogout} loading={loggingOut}>
        ログアウト
      </Button>
    </HStack>
  );
}

// 患者の画面の枠。上に帯があり、メニューは横に並ぶ。スマホの幅でも崩れない（内容は1列）
export function TopBarShell({
  brand,
  context,
  nav,
  renderLink,
  userLabel,
  onLogout,
  loggingOut,
  children,
}: Props) {
  return (
    <Box minH="100dvh">
      <Box
        as="header"
        bg="app.surface"
        borderBottomWidth="1px"
        borderColor="app.border"
        position="sticky"
        top="0"
        zIndex="docked"
      >
        <Container maxW="3xl" py="3">
          <Flex justify="space-between" align="center" gap="3" wrap="wrap">
            <Brand brand={brand} context={context} />
            <UserArea userLabel={userLabel} onLogout={onLogout} loggingOut={loggingOut} />
          </Flex>
          <HStack as="nav" aria-label="メニュー" gap="2" mt="3">
            {nav.map((item) => (
              <Box
                key={item.href}
                px="4"
                py="2"
                rounded="full"
                fontWeight="bold"
                fontSize="sm"
                bg={item.active ? "app.brand" : "transparent"}
                color={item.active ? "white" : "app.brand"}
                borderWidth="1px"
                borderColor="app.brand"
                aria-current={item.active ? "page" : undefined}
                asChild
              >
                {renderLink(item, item.label)}
              </Box>
            ))}
          </HStack>
        </Container>
      </Box>
      <Container as="main" maxW="3xl" py="6">
        {children}
      </Container>
    </Box>
  );
}

// スタッフの画面の枠。左にメニュー、右に内容。表など、横に広い内容を置く
export function SidebarShell({
  brand,
  context,
  nav,
  renderLink,
  userLabel,
  onLogout,
  loggingOut,
  children,
}: Props) {
  return (
    <Flex minH="100dvh" align="stretch">
      <Stack
        as="aside"
        w="60"
        flexShrink="0"
        bg="app.surface"
        borderRightWidth="1px"
        borderColor="app.border"
        p="4"
        gap="6"
        position="sticky"
        top="0"
        h="100dvh"
      >
        <Brand brand={brand} context={context} />
        <Stack as="nav" aria-label="メニュー" gap="1">
          {nav.map((item) => (
            <Box
              key={item.href}
              px="3"
              py="2"
              rounded="md"
              fontSize="sm"
              fontWeight={item.active ? "bold" : "normal"}
              bg={item.active ? "app.brandSubtle" : "transparent"}
              color={item.active ? "app.brand" : "gray.800"}
              _hover={{ bg: "app.brandSubtle" }}
              aria-current={item.active ? "page" : undefined}
              asChild
            >
              {renderLink(item, item.label)}
            </Box>
          ))}
        </Stack>
      </Stack>
      <Box flex="1" minW="0">
        <Flex
          as="header"
          justify="end"
          px="8"
          py="3"
          bg="app.surface"
          borderBottomWidth="1px"
          borderColor="app.border"
        >
          <UserArea userLabel={userLabel} onLogout={onLogout} loggingOut={loggingOut} />
        </Flex>
        <Box as="main" px="8" py="6" maxW="6xl">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
