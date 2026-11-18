"use client";

import { useQuery } from "@apollo/client/react";
import { Card, LinkOverlay, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import NextLink from "next/link";
import { ClinicsDocument } from "./booking.graphql";

// 予約する医療機関を選ぶ
export function ClinicList() {
  const { data, loading, error } = useQuery(ClinicsDocument);

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return (
      <ErrorMessage
        title="医療機関の一覧を読み込めませんでした"
        description="時間をおいて、開き直してください"
      />
    );
  if (!data) return null;
  if (data.clinics.length === 0) return <EmptyMessage title="予約できる医療機関がありません" />;

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
      {data.clinics.map((clinic) => (
        <LinkBox key={clinic.id} asChild>
          <Card.Root bg="white" _hover={{ shadow: "md" }}>
            <Card.Body>
              <Card.Title>
                <LinkOverlay asChild>
                  <NextLink href={`/book/${clinic.id}`}>{clinic.name}</NextLink>
                </LinkOverlay>
              </Card.Title>
              <Text mt="2" color="gray.600" fontSize="sm">
                医師：{clinic.doctors.map((doctor) => doctor.name).join("、") || "—"}
              </Text>
            </Card.Body>
          </Card.Root>
        </LinkBox>
      ))}
    </SimpleGrid>
  );
}
