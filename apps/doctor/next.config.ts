import type { NextConfig } from "next";

// Rails（GraphQL）の場所。ブラウザには見せず、Next.js のサーバーだけが知る
const apiUrl = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // 共有のパッケージは TypeScript のまま置いているので、Next.js に変換してもらう
  transpilePackages: ["@clinic/ui", "@clinic/web-kit"],
  // ブラウザは、画面と同じオリジンの /graphql に送る。Next.js が、このアプリ用の入口（/graphql/doctor）へ中継する。
  // 同じオリジンになるので、Cookie のセッションがそのまま使え、CORS の設定が要らない
  async rewrites() {
    return [{ source: "/graphql", destination: `${apiUrl}/graphql/doctor` }];
  },
};

export default nextConfig;
