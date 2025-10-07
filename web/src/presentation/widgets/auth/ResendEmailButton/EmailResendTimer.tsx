import { formatTime } from "@/shared/utils/formatters";
import { authTexts } from "@/shared/locales/auth";

interface EmailResendTimerProps {
  secondsLeft: number;
}

export function EmailResendTimer({ secondsLeft }: EmailResendTimerProps) {
  const parts = authTexts.resendEmailTimer.split("{time}");

  return (
    <p className="body-reg">
      {parts[0]}
      <span className="body-med">{formatTime(secondsLeft)}</span>
    </p>
  );
}
