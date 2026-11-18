import { Box, type BoxProps } from "@chakra-ui/react";

// 白い面（カード）。一覧の1件・フォームの枠・表の外枠に使う
export function Surface(props: BoxProps) {
  return <Box bg="app.surface" borderWidth="1px" borderColor="app.border" rounded="xl" p="5" {...props} />;
}
