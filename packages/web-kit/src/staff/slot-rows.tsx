import { Box, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import { ConfirmButton } from "@clinic/ui/confirm-button";
import { Surface } from "@clinic/ui/surface";
import { formatDate, formatTime } from "../datetime";

type Slot = { id: string; startsAt: string; endsAt: string; canClose: boolean; doctor: { name: string } };

type Props = {
  slots: readonly Slot[];
  // 枠を閉じる。閉じられる枠（canClose）にだけ、ボタンを出す
  onClose: (slotId: string) => Promise<void>;
  // 枠を選ぶ操作（代わりに予約する・この時刻に変える）。確認の窓を出してから送る。渡さなければ、出さない
  select?: { label: string; confirmTitle: string; onSelect: (slotId: string) => Promise<void> };
  // 送っている最中の枠。そのボタンを「送信中」にし、ほかのボタンは押せなくする（2回送らない）
  busyId: string | null;
};

// 空いている診療枠を、日ごとにまとめて並べる（スタッフの画面用）。props だけで描く
export function SlotRows({ slots, onClose, select, busyId }: Props) {
  const days = new Map<string, Slot[]>();
  for (const slot of slots) {
    const day = formatDate(slot.startsAt);
    days.set(day, [...(days.get(day) ?? []), slot]);
  }

  return (
    <Stack gap="5">
      {[...days].map(([day, daySlots]) => (
        <Surface key={day} as="section" aria-label={day} p="0" overflow="hidden">
          <Heading as="h2" size="sm" px="5" py="3" bg="app.brandSubtle" color="app.brand">
            {day}
            <Text as="span" ms="2" fontWeight="normal" color="app.muted">
              空き {daySlots.length} 枠
            </Text>
          </Heading>
          <Box>
            {daySlots.map((slot) => {
              const name = `${day} ${formatTime(slot.startsAt)} ${slot.doctor.name}`;
              return (
                <HStack
                  key={slot.id}
                  justify="space-between"
                  px="5"
                  py="2"
                  borderTopWidth="1px"
                  borderColor="app.border"
                >
                  <Text className="tabular">
                    {formatTime(slot.startsAt)}〜{formatTime(slot.endsAt)}
                    <Text as="span" color="app.muted" ms="4">
                      {slot.doctor.name}
                    </Text>
                  </Text>
                  <HStack gap="2">
                    {slot.canClose ? (
                      <ConfirmButton
                        size="sm"
                        variant="outline"
                        disabled={busyId !== null}
                        aria-label={`${name} を閉じる`}
                        title="この枠を閉じますか？"
                        description={`${name}。閉じた枠は、予約できなくなります。`}
                        confirmLabel="閉じる"
                        danger
                        onConfirm={() => onClose(slot.id)}
                      >
                        閉じる
                      </ConfirmButton>
                    ) : null}
                    {select ? (
                      <ConfirmButton
                        size="sm"
                        colorPalette="teal"
                        disabled={busyId !== null}
                        aria-label={`${name} を選ぶ（${select.label}）`}
                        title={select.confirmTitle}
                        description={`${name}〜${formatTime(slot.endsAt)}`}
                        confirmLabel={select.label}
                        onConfirm={() => select.onSelect(slot.id)}
                      >
                        {select.label}
                      </ConfirmButton>
                    ) : null}
                  </HStack>
                </HStack>
              );
            })}
          </Box>
        </Surface>
      ))}
    </Stack>
  );
}
