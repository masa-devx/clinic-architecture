// Apollo Client の data masking の型を、GraphQL Codegen が作る型（inlineFragmentTypes: "mask"）に合わせる。
// これで、useQuery などの結果の型から fragment の中身が隠れ、useFragment の結果の型には中身が出る
import type { GraphQLCodegenDataMasking } from "@apollo/client/masking";

declare module "@apollo/client" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface TypeOverrides extends GraphQLCodegenDataMasking.TypeOverrides {}
}
