import { useCallback, useState } from "react";

import { AppErrorProps } from "@/shared/errors/types";
import { confirmEmailThunk } from "../thunks/authThunks";
import { useAppDispatch } from "@/infrastructure/redux/hooks";

export type EmailConfirmStatus = "loading" | "success" | "error";

export const useEmailConfirm = (): {
  status: EmailConfirmStatus;
  errorMessage: string | null;
  confirmEmail: (token: string) => Promise<void>;
} => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<EmailConfirmStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmEmail = useCallback(
    async (token: string) => {
      setStatus("loading");
      try {
        const thunk = confirmEmailThunk(token);
        await dispatch(thunk).unwrap();
        setStatus("success");
      } catch (error) {
        // TODO: add log to sentry
        const typedError = error as AppErrorProps;
        setStatus("error");
        setErrorMessage(
          typedError.message || "Failed to confirm email. Please try again."
        );
      }
    },
    [dispatch]
  );
  return { status, errorMessage, confirmEmail };
};
