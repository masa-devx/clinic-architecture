import { readdirSync } from "node:fs";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// 3つのアプリ（apps/patient・clerk・doctor）で共通の ESLint の設定。
// 層の決まり（docs/frontend.md の1章）を、import の向きで止める
//   app → features → lib・packages の向きにだけ import する
//   features どうしは、直接 import しない（要るなら lib か packages に下ろすか、app で組み合わせる）
export function createAppConfig(appUrl) {
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
    { ignores: [".next/**", "next-env.d.ts", "lib/gql/**"] },
    ...nextVitals,
    ...nextTypescript,
    { rules: { "import/no-restricted-paths": ["error", { zones: layerZones }] } },
  ];
}
