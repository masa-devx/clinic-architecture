import { graphql } from "@/lib/gql";

export const LoginDocument = graphql(`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      viewer {
        id
        kind
      }
      errors {
        code
        message
        field
      }
    }
  }
`);

export const LogoutDocument = graphql(`
  mutation Logout {
    logout {
      errors {
        code
        message
      }
    }
  }
`);
