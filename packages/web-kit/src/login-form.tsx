"use client";

import { Button, Center, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { ErrorMessage } from "@clinic/ui/state-message";
import { Surface } from "@clinic/ui/surface";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginValues } from "./login-schema";

type Props = {
  // 例: 「患者さまのログイン」
  title: string;
  // その下の説明（どの画面か）
  description: string;
  // ログインを送る。断られたら、その理由の文を返す。成功なら null
  login: (values: LoginValues) => Promise<string | null>;
  // ログインできたあとに移る画面
  homePath: string;
};

// ログインのフォーム。3つのアプリで同じ見た目。送り先（mutation）は、アプリごとに渡す
export function LoginForm({ title, description, login, homePath }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const error = await login(values);
      if (error) return setFormError(error);
      // サーバーの部品（レイアウト）にログインを確かめ直させるために、ページごと移る
      window.location.assign(homePath);
    } catch {
      // 通信の失敗などは、Apollo の設定（apollo.ts）の1か所で知らせている
    }
  });

  return (
    <Center minH="100dvh" p="4">
      <Surface w="full" maxW="sm" p="8">
        <form onSubmit={onSubmit} noValidate>
          <Stack gap="5">
            <Stack gap="1">
              <Heading as="h1" size="lg" color="app.brand">
                {title}
              </Heading>
              <Text fontSize="sm" color="app.muted">
                {description}
              </Text>
            </Stack>
            {formError ? <ErrorMessage title={formError} /> : null}
            <Field.Root invalid={!!errors.email}>
              <Field.Label>メールアドレス</Field.Label>
              <Input type="email" size="lg" autoComplete="username" {...register("email")} />
              <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.password}>
              <Field.Label>パスワード</Field.Label>
              <Input type="password" size="lg" autoComplete="current-password" {...register("password")} />
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>
            {/* 送っているあいだは押せない（2回押しても、2回送らない） */}
            <Button type="submit" size="lg" colorPalette="teal" loading={isSubmitting}>
              ログイン
            </Button>
          </Stack>
        </form>
      </Surface>
    </Center>
  );
}
