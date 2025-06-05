import { useEffect, useRef } from "react";
import styled from "styled-components";

import { useEmailConfirm } from "@/application/auth/hooks/useEmailConfirm";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";
import SuccessConfirmationView from "./SuccessConfirmationView";
import ErrorView from "./ErrorView";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

export default function ConfirmByTokenPage({ token }: { token: string }) {
  const { status, errorMessage, confirmEmail } = useEmailConfirm();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (token && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      confirmEmail(token);
    }
  }, [token, confirmEmail]);

  switch (status) {
    case "loading":
      return <LoadingScreen />;
    case "success":
      return <SuccessConfirmationView />;
    case "error":
      return <ErrorView message={errorMessage || "Неизвестная ошибка"} />;
    default:
      return <LoadingScreen />;
  }
}
