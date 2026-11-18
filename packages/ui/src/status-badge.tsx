import { Badge } from "@chakra-ui/react";

// 状態の印。色だけに頼らず、必ず言葉を出す
export function StatusBadge({
  label,
  color,
  size = "md",
}: {
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Badge colorPalette={color} size={size} variant="subtle" rounded="full" px="3">
      {label}
    </Badge>
  );
}
