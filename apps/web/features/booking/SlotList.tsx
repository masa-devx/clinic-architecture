import { Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { getFragmentData, type FragmentType } from "@/lib/gql";
import type { SlotRowFragment } from "@/lib/gql/graphql";
import { formatDate, formatTime } from "@/lib/datetime";
import { SlotRow } from "./booking.graphql";

type Props = {
  slots: readonly FragmentType<typeof SlotRow>[];
  // 枠を選ぶボタン（予約する・この時刻に変える）。渡さなければ、出さない
  onSelect?: (slotId: string) => void;
  selectLabel: string;
  // 枠を閉じるボタン。渡したときだけ、閉じられる枠（canClose）に出す
  onClose?: (slotId: string) => void;
  // 送っている最中の枠。そのボタンを「送信中」にし、ほかのボタンは押せなくする（2回送らない）
  busyId: string | null;
};

// 空いている枠を、日ごとにまとめて並べる。props だけで描く（データは取らない）
export function SlotList({ slots, onSelect, selectLabel, onClose, busyId }: Props) {
  const days = new Map<string, SlotRowFragment[]>();
  for (const each of slots) {
    const slot = getFragmentData(SlotRow, each);
    const day = formatDate(slot.startsAt);
    days.set(day, [...(days.get(day) ?? []), slot]);
  }

  return (
    <Stack gap="6">
      {[...days].map(([day, daySlots]) => (
        <Box key={day} as="section" aria-label={day}>
          <Heading as="h2" size="md" mb="2">
            {day}
          </Heading>
          <Stack gap="2">
            {daySlots.map((slot) => {
              const name = `${day} ${formatTime(slot.startsAt)} ${slot.doctor.name}`;
              return (
                <HStack
                  key={slot.id}
                  justify="space-between"
                  bg="white"
                  borderWidth="1px"
                  rounded="md"
                  px="4"
                  py="2"
                >
                  <Text>
                    {formatTime(slot.startsAt)}〜{formatTime(slot.endsAt)}
                    <Text as="span" color="gray.600" ms="3">
                      {slot.doctor.name}
                    </Text>
                  </Text>
                  <HStack gap="2">
                    {onClose && slot.canClose ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === `close-${slot.id}`}
                        disabled={busyId !== null}
                        onClick={() => onClose(slot.id)}
                        aria-label={`${name} を閉じる`}
                      >
                        閉じる
                      </Button>
                    ) : null}
                    {onSelect ? (
                      <Button
                        size="sm"
                        colorPalette="blue"
                        loading={busyId === slot.id}
                        disabled={busyId !== null}
                        onClick={() => onSelect(slot.id)}
                        aria-label={`${name} ${selectLabel === "予約する" ? "を予約する" : `を選ぶ（${selectLabel}）`}`}
                      >
                        {selectLabel}
                      </Button>
                    ) : null}
                  </HStack>
                </HStack>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
