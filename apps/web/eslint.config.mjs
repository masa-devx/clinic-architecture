import { readdirSync } from "node:fs";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// 層の決まり（docs/frontend.md の1章）を、import の向きで止める
//   app → features → lib・packages/ui の向きにだけ import する
//   features どうしは、直接 import しない（要るなら lib に下ろすか、app で組み合わせる）
const features = readdirSync(new URL("./features", import.meta.url), { withFileTypes: true })
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
    message: "features どうしは直接 import しない。lib に下ろすか、app で組み合わせる",
  })),
];

const config = [
  { ignores: [".next/**", "next-env.d.ts", "lib/gql/**", "playwright-report/**", "test-results/**"] },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "import/no-restricted-paths": ["error", { zones: layerZones }],
    },
  },
];

export default config;
