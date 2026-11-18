import { describe, expect, it } from "vitest";
import { initialValues, questionIdOf, toInput } from "./answers";

const questions = [
  { id: "1", kind: "TEXT" as const },
  { id: "2", kind: "SINGLE" as const },
  { id: "3", kind: "MULTIPLE" as const },
];

describe("問診のフォームの値の変換", () => {
  it("保存してある答えを、今の質問に当てはめる。答えのない質問は、空にする", () => {
    const saved = [
      { questionId: "1", text: "のどが痛い", selected: null },
      { questionId: "3", text: null, selected: ["せき"] },
    ];

    expect(initialValues(questions, saved)).toEqual({
      answers: { "1": "のどが痛い", "2": "", "3": ["せき"] },
    });
    expect(initialValues(questions, [])).toEqual({ answers: { "1": "", "2": "", "3": [] } });
  });

  it("質問の種類が変わっていたら、前の答えは当てはめない", () => {
    const saved = [{ questionId: "3", text: "前は文章だった", selected: null }];

    expect(initialValues(questions, saved).answers["3"]).toEqual([]);
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
