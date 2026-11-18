"use client";

import { useQuery } from "@apollo/client/react";
import { Badge, Box, Stack, Text } from "@chakra-ui/react";
import { PageHeader } from "@clinic/ui/page-header";
import { EmptyMessage, ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/datetime";
import { getFragmentData } from "@/lib/gql";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { QuestionnaireDetail, QuestionnaireDocument } from "./questionnaire.graphql";

// 問診の画面。答えられる人（患者）にはフォーム、読めるだけの人（担当の医師）には答えを出す。
// どちらになるかは、サーバーが返す can〜 で決める
export function QuestionnairePage({ appointmentId, donePath }: { appointmentId: string; donePath: string }) {
  const router = useRouter();
  const { data, loading, error } = useQuery(QuestionnaireDocument, {
    variables: { appointmentId },
    fetchPolicy: "cache-and-network",
  });

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return <ErrorMessage title="問診を読み込めませんでした" description="時間をおいて、開き直してください" />;
  if (!data) return null;

  const appointment = data.appointment ? getFragmentData(QuestionnaireDetail, data.appointment) : null;
  // 見られない予約と、問診を見られない人（事務スタッフ）は、どちらも「見つからない」にする
  if (!appointment || !appointment.canViewQuestionnaire) return <ErrorMessage title="問診が見つかりません" />;

  const { slot, patient, questionnaire } = appointment;
  return (
    <Box>
      <PageHeader
        title="問診"
        description={`${slot.clinic.name}・${formatDateTime(slot.startsAt)}・${slot.doctor.name}・${patient.name} さま`}
      />
      {appointment.canAnswerQuestionnaire ? (
        // 保存してある答えが変わったら（取り直しで、ほかの画面からの保存が届いたときも）、フォームを作り直して、最初の値に反映する
        <QuestionnaireForm
          key={JSON.stringify(questionnaire?.answers ?? [])}
          appointment={appointment}
          onSubmitted={() => router.push(donePath)}
        />
      ) : !questionnaire ? (
        <EmptyMessage title="問診の答えは、ありません" />
      ) : (
        <Stack gap="5" maxW="xl">
          <Box>
            <Badge colorPalette={questionnaire.submitted ? "green" : "gray"}>
              {questionnaire.submitted ? "提出済" : "途中まで保存（未提出）"}
            </Badge>
            {questionnaire.submittedAt ? (
              <Text as="span" ms="2" fontSize="sm" color="gray.600">
                {formatDateTime(questionnaire.submittedAt)}
              </Text>
            ) : null}
          </Box>
          {questionnaire.answers.map((answer) => (
            <Box key={answer.questionId} bg="white" borderWidth="1px" rounded="md" p="4">
              <Text fontWeight="bold" mb="1">
                {answer.label}
              </Text>
              <Text whiteSpace="pre-wrap">
                {(answer.selected ? answer.selected.join("、") : answer.text) || "（答えなし）"}
              </Text>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
