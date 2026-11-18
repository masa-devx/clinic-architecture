import { graphql } from "@/lib/gql";

export const PatientLoginDocument = graphql(`
  mutation PatientLogin($email: String!, $password: String!) {
    patientLogin(email: $email, password: $password) {
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

export const StaffLoginDocument = graphql(`
  mutation StaffLogin($email: String!, $password: String!) {
    staffLogin(email: $email, password: $password) {
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
