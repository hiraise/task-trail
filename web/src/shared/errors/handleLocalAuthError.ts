import { AxiosError } from "axios";

import { AppError, AppErrorType } from "./types";
import { errorTexts } from "../locales/messages";

export const localErrorHandlers: Record<
  string,
  (error: unknown) => AppError | null
> = {
  signUp: (error) => {
    const isAxiosError = error instanceof AxiosError;
    switch (isAxiosError && error?.response?.status) {
      case 400:
        return new AppError(AppErrorType.AUTH, errorTexts.invalidCredentials);
      case 409:
        return new AppError(AppErrorType.AUTH, errorTexts.userAlreadyExists);
      default:
        return null;
    }
  },
};
