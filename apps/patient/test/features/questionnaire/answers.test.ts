import { describe, expect, it } from "vitest";
import { initialValues, questionIdOf, toInput } from "@/features/questionnaire/answers";

// 問診のフォームの値の変換（features/questionnaire/answers.ts）

const questions = [
  { id: "1", kind: "TEXT" as const },
  { id: "2", kind: "SINGLE" as const },
  { id: "3", kind: "MULTIPLE" as const },
];

// 保存してある答え（質問 2 には、まだ答えていない）
const saved = [
  { questionId: "1", text: "のどが痛い", selected: null },
  { questionId: "3", text: null, selected: ["せき"] },
];

// 質問 3 は、前は文章の質問だった（あとで複数選択に変わった）
const savedBeforeKindChanged = [{ questionId: "3", text: "前は文章だった", selected: null }];

describe("正常系", () => {
  it("保存してある答えを、今の質問に当てはめる。答えのない質問は、空にする", () => {
    expect(initialValues(questions, saved)).toEqual({
      answers: { "1": "のどが痛い", "2": "", "3": ["せき"] },
    });
    expect(initialValues(questions, [])).toEqual({ answers: { "1": "", "2": "", "3": [] } });
  });

  it("送るときは、文章・選択を text、複数選択を selected に入れる", () => {
    expect(toInput(questions, { answers: { "1": "のどが痛い", "2": "", "3": ["せき", "発熱"] } })).toEqual([
      { questionId: "1", text: "のどが痛い" },
      { questionId: "2", text: "" },
      { questionId: "3", selected: ["せき", "発熱"] },
    ]);
  });

  it("エラーの field から、質問の id を取り出す", () => {
    expect(questionIdOf("answers.12")).toBe("12");
    expect(questionIdOf("appointmentId")).toBeNull();
    expect(questionIdOf(null)).toBeNull();
  });
});

describe("異常系", () => {
  it("質問の種類が変わっていたら、前の答えは当てはめない", () => {
    expect(initialValues(questions, savedBeforeKindChanged).answers["3"]).toEqual([]);
  });
});
