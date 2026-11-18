"use client";

import { Button, Dialog, Portal, type ButtonProps } from "@chakra-ui/react";
import { useState, type ReactNode } from "react";

type Props = Omit<ButtonProps, "onClick" | "title"> & {
  // 確認の窓の題と、説明
  title: string;
  description?: ReactNode;
  // 確認の窓の、実行するボタンの言葉（例: 「キャンセルする」）
  confirmLabel: string;
  // 取り消せない・影響の大きい操作なら true（実行するボタンを赤にする）
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};

// 押すと、確認の窓を出してから実行するボタン。取り消す・確定するなど、押し間違えると困る操作に使う。
// 実行しているあいだは、窓を閉じさせない（閉じられると、後ろのほかのボタンを押せてしまい、2つ目の操作が並んで送られる）
export function ConfirmButton({
  title,
  description,
  confirmLabel,
  danger = false,
  onConfirm,
  children,
  ...button
}: Props) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(event) => {
        if (!running) setOpen(event.open);
      }}
      closeOnEscape={!running}
      closeOnInteractOutside={!running}
      lazyMount
      unmountOnExit
    >
      <Dialog.Trigger asChild>
        <Button {...button}>{children}</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            {description ? <Dialog.Body>{description}</Dialog.Body> : null}
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" disabled={running}>
                  やめる
                </Button>
              </Dialog.ActionTrigger>
              {/* 実行しているあいだは押せない（2回送らない） */}
              <Button colorPalette={danger ? "red" : "teal"} loading={running} onClick={run}>
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
