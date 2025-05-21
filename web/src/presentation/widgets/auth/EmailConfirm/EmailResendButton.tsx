import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { emailConfirmTexts } from "@/shared/locales/emailConfirm";

export default function EmailResendButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <SubmitButton $variant="text" onClick={onClick}>
      {emailConfirmTexts.resendEmail}
    </SubmitButton>
  );
}
