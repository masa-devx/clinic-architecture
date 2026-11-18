import { z } from "zod";

// ログインのフォームの検証。サーバーでも確かめるので、ここは「送る前に気づける誤り」だけ
export const loginSchema = z.object({
  email: z.email("メールアドレスの形で入れてください"),
  password: z.string().min(1, "パスワードを入れてください"),
});

export type LoginValues = z.infer<typeof loginSchema>;
