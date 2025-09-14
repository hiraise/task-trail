import { useEffect } from "react";
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
  const { mutateAsync: confirm, isError, isPending, isSuccess, error } = useEmailConfirm();

  useEffect(() => {
    if (token) confirm(token);
  }, [confirm, token]);

  if (isPending) return <LoadingScreen />;
  if (isError) return <ErrorView message={error.message} />;
  if (isSuccess) return <SuccessConfirmationView />;
  return <LoadingScreen />;
}
