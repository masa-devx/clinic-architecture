// E2E で使う、初期データのログインの情報。正は apps/api/db/seeds.rb（そちらを変えたら、ここも合わせる）
// 手元だけの捨ててよい値
export const PASSWORD = "password-for-local-only";

export const PATIENT = { email: "patient2@example.com", name: "中村 さくら" };
export const DOCTOR = { email: "doctor1@sakura.example", name: "佐藤 一郎" };
export const CLERK = { email: "clerk1@sakura.example", name: "田中 美咲", clinic: "さくら内科クリニック" };
export const OTHER_CLINIC_CLERK = { email: "clerk1@momiji.example", clinic: "もみじ皮膚科" };
