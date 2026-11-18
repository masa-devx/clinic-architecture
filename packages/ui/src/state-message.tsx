import { Alert, Center, EmptyState, Spinner, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

// 読み込み中・空・エラーの見せ方を、どの画面でも同じにする

export function LoadingMessage({ label = "読み込んでいます" }: { label?: string }) {
  return (
    <Center py="10" role="status" aria-live="polite">
      <VStack>
        <Spinner />
        <Text color="gray.600">{label}</Text>
      </VStack>
    </Center>
  );
}

export function EmptyMessage({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <VStack textAlign="center">
          <EmptyState.Title>{title}</EmptyState.Title>
          {description ? <EmptyState.Description>{description}</EmptyState.Description> : null}
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  );
}

export function ErrorMessage({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <Alert.Root status="error" role="alert">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {description ? <Alert.Description>{description}</Alert.Description> : null}
      </Alert.Content>
    </Alert.Root>
  );
}
