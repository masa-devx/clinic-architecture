import type { CodegenConfig } from "@graphql-codegen/cli";

// Rails が書き出した、このアプリ用のスキーマ（apps/api/schema/patient.graphql）と、画面のコードの中のクエリから、型を作る
const config: CodegenConfig = {
  schema: "../api/schema/patient.graphql",
  documents: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "!lib/gql/**"],
  generates: {
    "./lib/gql/": {
      preset: "client",
      presetConfig: {
        // fragment の中身を取り出す関数の名前。既定の useFragment は、React のフックに見えて紛らわしい
        fragmentMasking: { unmaskFunctionName: "getFragmentData" },
      },
      config: {
        scalars: { ISO8601DateTime: "string", ISO8601Date: "string" },
        enumsAsTypes: true,
        useTypeImports: true,
      },
    },
  },
};

export default config;
