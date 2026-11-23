import type { CodegenConfig } from "@graphql-codegen/cli";

// Rails が書き出した、このアプリ用のスキーマ（apps/api/schema/doctor.graphql）と、画面の .graphql から、型を作る。
// 形は、Apollo Client のドキュメントがすすめるもの（near-operation-file＋typescript-operations＋typed-document-node）。
// 選んだ理由は docs/decisions.md の D-020
const config: CodegenConfig = {
  schema: "../api/schema/doctor.graphql",
  documents: ["features/**/*.graphql", "lib/**/*.graphql"],
  // 2つの出力に共通の設定
  config: {
    scalars: { ISO8601DateTime: "string", ISO8601Date: "string" },
    // enum は、TypeScript の enum ではなく、文字列の合併型（"BOOKED" | "CANCELED" …）で出す
    enumType: "string-literal",
    useTypeImports: true,
  },
  generates: {
    // enum と入力の型（操作で使うものだけ）。操作の型は、ここには出さない
    "./types/__generated__/graphql.ts": {
      plugins: ["typescript-operations"],
      config: { generateOperationTypes: false },
    },
    // .graphql の隣に <名前>.generated.ts を作る（操作の型と、型付きのドキュメント）
    "./": {
      preset: "near-operation-file",
      presetConfig: { extension: ".generated.ts" },
      plugins: ["typescript-operations", "typed-document-node"],
      config: {
        importSchemaTypesFrom: "./types/__generated__/graphql.ts",
        // Apollo Client は、ルート（Query・Mutation）以外の型に、必ず __typename を足す
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        // fragment の中身は、Apollo Client の data masking で隠す（親の型からは見えない）。@unmask を付けた所だけ見せる
        inlineFragmentTypes: "mask",
        customDirectives: { apolloUnmask: true },
      },
    },
  },
};

export default config;
