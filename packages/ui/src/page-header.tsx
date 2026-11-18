import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

// ページの題と、その下の短い説明。右側に、そのページの主な操作を置ける
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Flex mb="6" justify="space-between" align="end" gap="4" wrap="wrap">
      <Box>
        <Heading as="h1" size="xl">
          {title}
        </Heading>
        {description ? (
          <Text mt="1" color="app.muted">
            {description}
          </Text>
        ) : null}
      </Box>
      {actions}
    </Flex>
  );
}
