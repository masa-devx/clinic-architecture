"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { PageHeader } from "@clinic/ui/page-header";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { StatusBadge } from "@clinic/ui/status-badge";
import { Surface } from "@clinic/ui/surface";
import { formatDateTime } from "@clinic/web-kit/datetime";
import NextLink from "next/link";
import { AppointmentDetailDocument } from "../graphql/appointments.generated";

// 予約1件の、問診の答え（医師は、読むだけ）
export function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const { data, loading, error } = useQuery(AppointmentDetailDocument, {
    variables: { id: appointmentId },
    fetchPolicy: "cache-and-network",
  });

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return <ErrorMessage title="問診を読み込めませんでした" description="時間をおいて、開き直してください" />;
  if (!data) return null;
  // 担当でない予約は、あっても「見つからない」
  if (!data.appointment) return <ErrorMessage title="予約が見つかりません" />;

  const { patient, slot, questionnaire } = data.appointment;
  return (
    <Box maxW="3xl">
      <PageHeader
        title={`${patient.name} さまの問診`}
        description={formatDateTime(slot.startsAt)}
        actions={
          <Button variant="outline" asChild>
            <NextLink href="/appointments">予定に戻る</NextLink>
          </Button>
        }
      />
      {!questionnaire ? (
        <EmptyMessage title="問診の答えは、ありません" />
      ) : (
        <Stack gap="4">
          <Box>
            <StatusBadge
              label={questionnaire.submitted ? "提出済" : "途中まで保存（未提出）"}
              color={questionnaire.submitted ? "green" : "gray"}
            />
            {questionnaire.submittedAt ? (
              <Text as="span" ms="2" fontSize="sm" color="app.muted" className="tabular">
                {formatDateTime(questionnaire.submittedAt)}
              </Text>
            ) : null}
          </Box>
          {questionnaire.answers.map((answer) => (
            <Surface key={answer.questionId}>
              <Text fontSize="sm" color="app.muted" mb="1">
                {answer.label}
              </Text>
              <Text fontSize="lg" whiteSpace="pre-wrap">
                {(answer.selected ? answer.selected.join("、") : answer.text) || "（答えなし）"}
              </Text>
            </Surface>
          ))}
        </Stack>
      )}
    </Box>
  );
}
