"use client";

import { Button, Center, Code, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect } from "react";

// ページが見つからないとき・画面でエラーが起きたときの画面。3つのアプリで同じにする。
// 使う人に見せるのは「何が起きたか」と「次に何をすればよいか」だけ。エラーの中身（error.message）は見せない
// （サーバーの内部の情報が混じることがあり、使う人には直せないため）

type Props = { homeHref?: string };

export function NotFoundPage({ homeHref = "/" }: Props) {
  return (
    <Center minH="70vh" px="4">
      <VStack gap="4" textAlign="center" maxW="md">
        <Text className="tabular" fontSize="5xl" fontWeight="bold" color="app.muted">
          404
        </Text>
        <Heading as="h1" size="lg">
          ページが見つかりません
        </Heading>
        <Text color="app.muted">
          URL が正しいかを確かめてください。消えた予約や、ほかの医療機関のページは開けません。
        </Text>
        <Button asChild colorPalette="teal">
          <NextLink href={homeHref}>最初の画面へ戻る</NextLink>
        </Button>
      </VStack>
    </Center>
  );
}

type ErrorPageProps = Props & {
  // Next.js が渡すエラー。digest は、サーバーのログと突き合わせるための番号（中身は含まない）
  error: Error & { digest?: string };
  // 同じ画面を、もう一度描き直す
  reset: () => void;
};

export function ErrorPage({ error, reset, homeHref = "/" }: ErrorPageProps) {
  useEffect(() => {
    // 開発のときに原因を追えるように、ブラウザのコンソールにだけ出す（画面には出さない）
    console.error(error);
  }, [error]);

  return (
    <Center minH="70vh" px="4">
      <VStack gap="4" textAlign="center" maxW="md" role="alert">
        <Heading as="h1" size="lg">
          画面を表示できませんでした
        </Heading>
        <Text color="app.muted">
          一時的な問題かもしれません。もう一度試しても直らないときは、時間をおいて開き直してください。
        </Text>
        {error.digest ? (
          <Text fontSize="sm" color="app.muted">
            問い合わせのときは、この番号を伝えてください：<Code>{error.digest}</Code>
          </Text>
        ) : null}
        <HStack gap="3">
          <Button colorPalette="teal" onClick={reset}>
            もう一度試す
          </Button>
          <Button asChild variant="outline">
            <NextLink href={homeHref}>最初の画面へ戻る</NextLink>
          </Button>
        </HStack>
      </VStack>
    </Center>
  );
}
