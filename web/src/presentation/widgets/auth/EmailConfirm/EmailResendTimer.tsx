import styled from "styled-components";

import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { emailConfirmTexts } from "@/shared/locales/emailConfirm";


function formatTime(secondsLeft: number) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const PassiveTimer = styled(SubmitButton).attrs({ $variant: "text" })`
  font-size: 14px;
  font-weight: 400;
  color: #5a5a5a;
  text-align: center;

  :disabled {
    opacity: 1;
  }
`;

export default function EmailResendTimer({
  secondsLeft,
}: {
  secondsLeft: number;
}) {
  return (
    <PassiveTimer disabled={true}>
      {emailConfirmTexts.resendEmailTimerText(formatTime(secondsLeft))}
    </PassiveTimer>
  );
}
