"use client";

import React, { useEffect, useState, useCallback } from "react";
import EmailResendTimer from "./EmailResendTimer";
import EmailResendButton from "./EmailResendButton";
import styled from "styled-components";

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RESEND_DELAY = 4 * 60 + 30; // 4:30

interface EmailResendContainerProps {
  onResend: () => void;
  initialDelay?: number;
}

export default function EmailResendContainer({
  onResend,
  initialDelay = RESEND_DELAY,
}: EmailResendContainerProps) {
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
    <StyledContainer>
      {secondsLeft > 0 ? (
        <EmailResendTimer secondsLeft={secondsLeft} />
      ) : (
        <EmailResendButton onClick={handleResend} />
      )}
    </StyledContainer>
  );
}
