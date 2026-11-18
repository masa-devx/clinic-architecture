import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ConfirmButton } from "@clinic/ui/confirm-button";
import { Surface } from "@clinic/ui/surface";
import { formatDate, formatTime } from "@clinic/web-kit/datetime";

type Slot = { id: string; startsAt: string; endsAt: string; doctor: { id: string; name: string } };

type Props = {
  slots: readonly Slot[];
  clinicName: string;
  // 予約するのか、今の予約の時刻を変えるのか（ボタンと確認の言葉が変わる）
  mode: "book" | "reschedule";
  onSelect: (slotId: string) => Promise<void>;
  // 予約を送っているあいだは、どの時刻のボタンも押せない（2回送らない）
  busy: boolean;
};

// 空いている枠を、日ごと・医師ごとにまとめて、時刻のボタンで並べる。押すと、確認してから予約する。
// props だけで描く（データは取らない）
export function SlotGrid({ slots, clinicName, mode, onSelect, busy }: Props) {
  // 日 → 医師 → 枠、の順にまとめる
  const days = new Map<string, Map<string, Slot[]>>();
  for (const slot of slots) {
    const day = formatDate(slot.startsAt);
    const doctors = days.get(day) ?? new Map<string, Slot[]>();
    doctors.set(slot.doctor.name, [...(doctors.get(slot.doctor.name) ?? []), slot]);
    days.set(day, doctors);
  }
  const verb = mode === "book" ? "予約する" : "この時刻に変える";

  return (
    <Stack gap="4">
      {[...days].map(([day, doctors]) => (
        <Surface key={day} as="section" aria-label={day}>
          <Heading as="h2" size="md" mb="3">
            {day}
          </Heading>
          <Stack gap="4">
            {[...doctors].map(([doctorName, doctorSlots]) => (
              <Box key={doctorName}>
                <Text fontSize="sm" color="app.muted" mb="2">
                  {doctorName} 医師
                </Text>
                <SimpleGrid columns={{ base: 3, sm: 4, md: 6 }} gap="2">
                  {doctorSlots.map((slot) => {
                    const time = formatTime(slot.startsAt);
                    return (
                      <ConfirmButton
                        key={slot.id}
                        size="lg"
                        variant="outline"
                        colorPalette="teal"
                        className="tabular"
                        disabled={busy}
                        aria-label={`${day} ${time} ${doctorName} を${mode === "book" ? "予約する" : "選ぶ（この時刻に変える）"}`}
                        title={mode === "book" ? "この内容で予約しますか？" : "この時刻に変えますか？"}
                        description={`${day} ${time}〜${formatTime(slot.endsAt)}　${clinicName}　${doctorName} 医師`}
                        confirmLabel={verb}
                        onConfirm={() => onSelect(slot.id)}
                      >
                        {time}
                      </ConfirmButton>
                    );
                  })}
                </SimpleGrid>
              </Box>
            ))}
          </Stack>
        </Surface>
      ))}
    </Stack>
  );
}
