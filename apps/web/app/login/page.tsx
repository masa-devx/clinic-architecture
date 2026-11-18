import { Container } from "@chakra-ui/react";
import { LoginForm } from "@/features/auth/LoginForm";

export default function PatientLoginPage() {
  return (
    <Container maxW="sm" py="16">
      <LoginForm kind="patient" />
    </Container>
  );
}
