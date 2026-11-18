import { Box, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

// ページの題と、その下の短い説明
export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <Box mb="6">
      <Heading as="h1" size="xl">
        {title}
      </Heading>
      {description ? (
        <Text mt="1" color="gray.600">
          {description}
        </Text>
      ) : null}
    </Box>
  );
}
