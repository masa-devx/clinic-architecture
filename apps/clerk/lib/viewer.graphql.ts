import { graphql } from "@/lib/gql";
import type { MeQuery } from "@/lib/gql/graphql";

export const MeDocument = graphql(`
  query Me {
    me {
      id
      kind
      name
      canViewAuditLogs
      clinic {
        id
        name
        doctors {
          id
          name
        }
      }
    }
  }
`);

// ログインしている人
export type Viewer = NonNullable<MeQuery["me"]>;
