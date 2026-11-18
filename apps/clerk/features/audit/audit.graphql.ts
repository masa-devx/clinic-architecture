import { graphql } from "@/lib/gql";

export const AuditLogsDocument = graphql(`
  query AuditLogs($after: String) {
    auditLogs(first: 30, after: $after) {
      edges {
        node {
          id
          occurredAt
          action
          actorKind
          actorName
          patientName
          subject
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
