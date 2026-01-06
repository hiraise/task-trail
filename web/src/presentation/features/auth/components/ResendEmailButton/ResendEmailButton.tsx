"use client";

import React, { useEffect, useState, useCallback } from "react";

import { SubmitButton } from "@/presentation/shared";
import { authTexts } from "@/shared/locales/auth";

import { EmailResendTimer } from "./EmailResendTimer";
import styles from "./ResendEmailButton.module.css";



const RESEND_DELAY = 4 * 60 + 30; // 4:30

interface ResendEmailButtonProps {
  onResend: () => void;
  initialDelay?: number;
}

export function ResendEmailButton({
  onResend,
  initialDelay = RESEND_DELAY,
}: ResendEmailButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialDelay);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleResend = useCallback(() => {
    setSecondsLeft(initialDelay);
    onResend();
  }, [onResend, initialDelay]);

  return (
    <div className={styles.button}>
      {secondsLeft > 0 ? (
        <EmailResendTimer secondsLeft={secondsLeft} />
      ) : (
        <SubmitButton className="btn-font-m" variant="text" onClick={handleResend}>
          {authTexts.resendEmail}
        </SubmitButton>
      )}
    </div>
  );
}
