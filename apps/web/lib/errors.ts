import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ErrorCode } from "@/lib/gql/graphql";

// mutation の結果の errors に入る、使う人が直せるエラー（サーバーの UserError と同じ形）
export type UserError = { code: ErrorCode; message: string; field?: string | null };

// 項目に結び付くエラーはフォームの項目に出し、結び付かないエラーの文を返す（フォームの上にまとめて出す用）
export function applyUserErrors<T extends FieldValues>(
  errors: readonly UserError[],
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string[] {
  const rest: string[] = [];
  for (const error of errors) {
    const field = fields.find((name) => name === error.field);
    if (field) setError(field, { type: "server", message: error.message });
    else rest.push(error.message);
  }
  return rest;
}
