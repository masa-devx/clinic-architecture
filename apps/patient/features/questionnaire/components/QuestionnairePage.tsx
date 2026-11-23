"use client";

import { useQuery } from "@apollo/client/react";
import { Box } from "@chakra-ui/react";
import { PageHeader } from "@clinic/ui/page-header";
import { ErrorMessage, LoadingMessage } from "@clinic/ui/state-message";
import { formatDateTime } from "@clinic/web-kit/datetime";
import { useRouter } from "next/navigation";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { QuestionnaireDocument } from "../graphql/questionnaire.generated";

// 問診に答える画面。答えられるのは、診察が始まる前まで（サーバーが返す canAnswerQuestionnaire で決める）
export function QuestionnairePage({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const { data, loading, error } = useQuery(QuestionnaireDocument, {
    variables: { appointmentId },
    fetchPolicy: "cache-and-network",
  });

  if (!data && loading) return <LoadingMessage />;
  if (!data && error)
    return <ErrorMessage title="問診を読み込めませんでした" description="時間をおいて、開き直してください" />;
  if (!data) return null;

  // QuestionnaireDetail の中身は、クエリの @unmask で、この画面から見える（この画面自身が読む fragment のため）
  const appointment = data.appointment;
  if (!appointment) return <ErrorMessage title="問診が見つかりません" />;

  const { slot, questionnaire } = appointment;
  return (
    <Box>
      <PageHeader
        title="問診"
        description={`${slot.clinic.name}・${formatDateTime(slot.startsAt)}・${slot.doctor.name} 医師`}
      />
      {appointment.canAnswerQuestionnaire ? (
        // 保存してある答えが変わったら（取り直しで、ほかの画面からの保存が届いたときも）、フォームを作り直して、最初の値に反映する
        <QuestionnaireForm
          key={JSON.stringify(questionnaire?.answers ?? [])}
          appointment={appointment}
          onSubmitted={() => router.push("/appointments")}
        />
      ) : (
        <ErrorMessage
          title="この予約の問診は、もう直せません"
          description="診察が始まったあと・キャンセルしたあとは、直せません"
        />
      )}
    </Box>
  );
}
