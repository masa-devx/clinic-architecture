"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { Button, Field, Heading, Input, Link, Stack, Text } from "@chakra-ui/react";
import { ErrorMessage } from "@clinic/ui/state-message";
import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PatientLoginDocument, StaffLoginDocument } from "./auth.graphql";
import { loginSchema, type LoginValues } from "./login-schema";

type Props = {
  // 患者とスタッフは、入口（画面も mutation も）が別
  kind: "patient" | "staff";
};

const TEXTS = {
  patient: {
    title: "患者さまのログイン",
    other: { href: "/staff/login", label: "スタッフの方はこちら" },
    home: "/appointments",
  },
  staff: {
    title: "スタッフのログイン",
    other: { href: "/login", label: "患者さまはこちら" },
    home: "/staff/appointments",
  },
} as const;

export function LoginForm({ kind }: Props) {
  const text = TEXTS[kind];
  const client = useApolloClient();
  const [patientLogin] = useMutation(PatientLoginDocument);
  const [staffLogin] = useMutation(StaffLoginDocument);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const payload =
        kind === "patient"
          ? (await patientLogin({ variables: values })).data?.patientLogin
          : (await staffLogin({ variables: values })).data?.staffLogin;
      const error = payload?.errors[0];
      if (error) return setFormError(error.message);
      if (!payload?.viewer) return;

      // 前にログインしていた人のデータがキャッシュに残らないように、空にする
      await client.clearStore();
      // サーバーの部品（レイアウト）にログインを確かめ直させるために、ページごと移る
      window.location.assign(text.home);
    } catch {
      // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="5">
        <Heading as="h1" size="xl">
          {text.title}
        </Heading>
        {formError ? <ErrorMessage title={formError} /> : null}
        <Field.Root invalid={!!errors.email}>
          <Field.Label>メールアドレス</Field.Label>
          <Input type="email" autoComplete="username" {...register("email")} />
          <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root invalid={!!errors.password}>
          <Field.Label>パスワード</Field.Label>
          <Input type="password" autoComplete="current-password" {...register("password")} />
          <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
        </Field.Root>
        {/* 送っているあいだは押せない（2回押しても、2回送らない） */}
        <Button type="submit" colorPalette="blue" loading={isSubmitting}>
          ログイン
        </Button>
        <Text fontSize="sm">
          <Link asChild colorPalette="blue">
            <NextLink href={text.other.href}>{text.other.label}</NextLink>
          </Link>
        </Text>
      </Stack>
    </form>
  );
}
