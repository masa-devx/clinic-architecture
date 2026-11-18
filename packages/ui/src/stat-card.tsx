import { Text } from "@chakra-ui/react";
import { Surface } from "./surface";

// 数字を1つ、大きく見せるカード（ダッシュボードの合計など）
export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Surface>
      <Text fontSize="sm" color="app.muted">
        {label}
      </Text>
      <Text className="tabular" fontSize="3xl" fontWeight="bold" lineHeight="1.3">
        {value}
      </Text>
      {hint ? (
        <Text fontSize="xs" color="app.muted">
          {hint}
        </Text>
      ) : null}
    </Surface>
  );
}
