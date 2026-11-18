"use client";

import { Portal, Stack, Toast, Toaster, createToaster } from "@chakra-ui/react";

// 画面の隅に出す、短い知らせ（トースト）。アプリ全体で1つ
export const toaster = createToaster({ placement: "top-end", pauseOnPageIdle: true });

export function notifySuccess(title: string) {
  toaster.create({ type: "success", title });
}

// 同じ文の知らせは、重ねて出さない（同じ id で作ると、出ているものを置き換える）。
// 取り直し（ポーリング）が続けて失敗しても、知らせが積み上がらない
export function notifyError(title: string, description?: string) {
  toaster.create({ id: `error:${title}`, type: "error", title, description });
}

export function AppToaster() {
  return (
    <Portal>
      <Toaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }}>
            <Toast.Indicator />
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title ? <Toast.Title>{toast.title}</Toast.Title> : null}
              {toast.description ? <Toast.Description>{toast.description}</Toast.Description> : null}
            </Stack>
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
}
