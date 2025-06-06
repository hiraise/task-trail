import { useSearchParams } from "next/navigation";

import { useResendEmail } from "@/application/auth/hooks/useResendEmail";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { Container } from "./ConfirmByTokenPage";

export default function ErrorView({ message }: { message: string }) {
  const email = useSearchParams().get("email") || "";
  const { resendEmail } = useResendEmail(email);

  return (
    <Container>
      <h2 style={{ color: "red" }}>{message}</h2>
      <Spacer size="16px" />
      <SubmitButton onClick={resendEmail}>Запросить код повторно</SubmitButton>
    </Container>
  );
}
