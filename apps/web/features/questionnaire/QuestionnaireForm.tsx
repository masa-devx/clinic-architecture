"use client";

import { useMutation } from "@apollo/client/react";
import { Button, Checkbox, Field, Fieldset, HStack, NativeSelect, Stack, Textarea } from "@chakra-ui/react";
import { ErrorMessage } from "@clinic/ui/state-message";
import { notifySuccess } from "@clinic/ui/toaster";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { QuestionnaireDetailFragment } from "@/lib/gql/graphql";
import { initialValues, questionIdOf, toInput, type FormValues } from "./answers";
import { SaveQuestionnaireDocument } from "./questionnaire.graphql";

type Props = {
  appointment: QuestionnaireDetailFragment;
  // 提出できたあとに呼ぶ
  onSubmitted: () => void;
};

// 問診に答えるフォーム。途中まで保存して、あとで続きを書ける。
// 必須や選択肢の確かめは、サーバーがして、悪い所を質問ごとにまとめて返す（決まりを、画面に写さない）
export function QuestionnaireForm({ appointment, onSubmitted }: Props) {
  const questions = appointment.questionnaireQuestions;
  const [save] = useMutation(SaveQuestionnaireDocument);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [sending, setSending] = useState<"draft" | "submit" | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: initialValues(questions, appointment.questionnaire?.answers ?? []),
  });

  const send = (submit: boolean) =>
    handleSubmit(async (values) => {
      setFormErrors([]);
      setSending(submit ? "submit" : "draft");
      try {
        const result = await save({
          variables: { appointmentId: appointment.id, answers: toInput(questions, values), submit },
        });
        const userErrors = result.data?.saveQuestionnaire.errors ?? [];
        if (userErrors.length > 0) {
          // 質問に結び付くエラーは、その質問の下に出す。結び付かないものは、上にまとめて出す
          const rest: string[] = [];
          for (const error of userErrors) {
            const questionId = questionIdOf(error.field);
            if (questionId) setError(`answers.${questionId}`, { type: "server", message: error.message });
            else rest.push(error.message);
          }
          return setFormErrors(rest);
        }
        notifySuccess(submit ? "問診を提出しました" : "途中まで保存しました");
        if (submit) onSubmitted();
      } catch {
        // 通信の失敗などは、Apollo の設定（lib/apollo/client.ts）の1か所で知らせている
      } finally {
        setSending(null);
      }
    });

  return (
    <form onSubmit={send(true)} noValidate>
      <Stack gap="6" maxW="xl">
        {formErrors.map((message) => (
          <ErrorMessage key={message} title={message} />
        ))}
        {questions.map((question) => {
          const error = errors.answers?.[question.id]?.message;
          if (question.kind === "MULTIPLE") {
            return (
              <Controller
                key={question.id}
                control={control}
                name={`answers.${question.id}`}
                render={({ field }) => {
                  const selected = Array.isArray(field.value) ? field.value : [];
                  return (
                    <Fieldset.Root invalid={!!error}>
                      <Fieldset.Legend>{question.label}</Fieldset.Legend>
                      <HStack gap="4" wrap="wrap">
                        {question.options.map((option) => (
                          <Checkbox.Root
                            key={option}
                            checked={selected.includes(option)}
                            onCheckedChange={({ checked }) =>
                              field.onChange(
                                checked ? [...selected, option] : selected.filter((each) => each !== option),
                              )
                            }
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>{option}</Checkbox.Label>
                          </Checkbox.Root>
                        ))}
                      </HStack>
                      <Fieldset.ErrorText>{error}</Fieldset.ErrorText>
                    </Fieldset.Root>
                  );
                }}
              />
            );
          }
          return (
            <Field.Root key={question.id} invalid={!!error} required={question.required}>
              <Field.Label>
                {question.label}
                <Field.RequiredIndicator />
              </Field.Label>
              {question.kind === "SINGLE" ? (
                <NativeSelect.Root bg="white">
                  <NativeSelect.Field {...register(`answers.${question.id}`)}>
                    <option value="">選んでください</option>
                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              ) : (
                <Textarea bg="white" rows={3} {...register(`answers.${question.id}`)} />
              )}
              <Field.ErrorText>{error}</Field.ErrorText>
            </Field.Root>
          );
        })}
        {/* 送っているあいだは、どちらも押せない（2回送らない） */}
        <HStack gap="3">
          <Button
            type="button"
            variant="outline"
            loading={sending === "draft"}
            disabled={sending !== null}
            onClick={send(false)}
          >
            途中まで保存する
          </Button>
          <Button
            type="submit"
            colorPalette="blue"
            loading={sending === "submit"}
            disabled={sending !== null}
          >
            {appointment.questionnaire?.submitted ? "直して提出する" : "提出する"}
          </Button>
        </HStack>
      </Stack>
    </form>
  );
}
