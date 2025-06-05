import { useDispatch } from "react-redux";
import { useCallback, useState } from "react";

import { AppDispatch } from "@/infrastructure/redux/store";
import { confirmEmailThunk } from "../thunks/confirmEmailThunk";
import { AppErrorProps } from "@/shared/errors/types";

export type EmailConfirmStatus = "loading" | "success" | "error";

export const useEmailConfirm = (): {
  status: EmailConfirmStatus;
  errorMessage: string | null;
  confirmEmail: (token: string) => Promise<void>;
} => {
  const dispatch = useDispatch<AppDispatch>();
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
