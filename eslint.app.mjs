import { readdirSync } from "node:fs";

// 3つのアプリ（apps/patient・clerk・doctor）で共通の ESLint の設定。
// Next.js の設定（eslint-config-next）は、それぞれのアプリの依存なので、アプリの側で読み込んで渡す
// （ここはリポジトリのルートにあり、ルートからは、アプリの依存が見えない）
//
// 層の決まり（docs/frontend.md の1章）を、import の向きで止める
//   app → features → lib・packages の向きにだけ import する
//   features どうしは、直接 import しない（要るなら lib か packages に下ろすか、app で組み合わせる）
export function createAppConfig(appUrl, nextConfigs) {
  const features = readdirSync(new URL("./features", appUrl), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const layerZones = [
    { target: "./lib", from: "./features", message: "lib は features を知らない。要る物は lib に下ろす" },
    { target: "./lib", from: "./app", message: "lib は app を知らない" },
    { target: "./features", from: "./app", message: "features は app を知らない" },
    ...features.map((feature) => ({
      target: `./features/${feature}`,
      from: "./features",
      except: [`./${feature}`],
      message: "features どうしは直接 import しない。lib か packages に下ろすか、app で組み合わせる",
    })),
  ];

  return [
    // 自動で作るファイル（pnpm codegen）は、見ない
    { ignores: [".next/**", "next-env.d.ts", "types/__generated__/**", "**/*.generated.ts"] },
    ...nextConfigs,
    { rules: { "import/no-restricted-paths": ["error", { zones: layerZones }] } },
  ];
}
