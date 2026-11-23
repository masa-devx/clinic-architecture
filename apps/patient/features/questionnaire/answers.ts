import type { QuestionKind } from "@/types/__generated__/graphql";

// 問診のフォームの値と、サーバーとのやり取りの形の変換。通信もしないし、時計も読まない

type Question = { id: string; kind: QuestionKind };
type SavedAnswer = { questionId: string; text?: string | null; selected?: readonly string[] | null };

// フォームの値。質問の id → 文章・選択なら文字、複数選択なら文字の並び
export type FormValues = { answers: Record<string, string | string[]> };

// 今の質問に、保存してある答えを当てはめて、フォームの最初の値を作る。
// 質問の種類があとで変わっていたら、その答えは当てはめない（文字を、複数選択の欄に入れない）
export function initialValues(questions: readonly Question[], saved: readonly SavedAnswer[]): FormValues {
  const answers: FormValues["answers"] = {};
  for (const question of questions) {
    const answer = saved.find((each) => each.questionId === question.id);
    if (question.kind === "MULTIPLE") answers[question.id] = [...(answer?.selected ?? [])];
    else answers[question.id] = answer?.text ?? "";
  }
  return { answers };
}

// サーバーへ送る形。文章・選択は text、複数選択は selected に入れる
export function toInput(questions: readonly Question[], values: FormValues) {
  return questions.map((question) => {
    const value = values.answers[question.id];
    return question.kind === "MULTIPLE"
      ? { questionId: question.id, selected: Array.isArray(value) ? value : [] }
      : { questionId: question.id, text: typeof value === "string" ? value : "" };
  });
}

// サーバーのエラーの field（"answers.<質問の id>"）から、質問の id を取り出す。ほかの形なら null
export function questionIdOf(field: string | null | undefined): string | null {
  return field?.match(/^answers\.(\d+)$/)?.[1] ?? null;
}
