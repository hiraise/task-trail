import { AxiosError } from "axios";

import { AppError, AppErrorType } from "./types";
import { errorTexts } from "../locales/messages";

export const localErrorHandlers: Record<
  string,
  (error: unknown) => AppError | null
> = {
  login: (error) => {
    const isAxiosError = error instanceof AxiosError;
    switch (isAxiosError && error?.response?.status) {
      case 400:
        return new AppError(AppErrorType.AUTH, errorTexts.invalidRequestBody);
      case 401:
        return new AppError(AppErrorType.AUTH, errorTexts.invalidCredentials);
      case 500:
        return new AppError(AppErrorType.AUTH, errorTexts.somethingWentWrong);
      default:
        return null;
    }
  },
  signUp: (error) => {
    const isAxiosError = error instanceof AxiosError;
    switch (isAxiosError && error?.response?.status) {
      case 400:
        return new AppError(AppErrorType.AUTH, errorTexts.invalidCredentials);
      case 409:
        return new AppError(AppErrorType.AUTH, errorTexts.userAlreadyExists);
      case 500:
        return new AppError(AppErrorType.AUTH, errorTexts.somethingWentWrong);
      default:
        return null;
    }
  },
  confirmEmail: (error) => {
    const isAxiosError = error instanceof AxiosError;
    switch (isAxiosError && error?.response?.status) {
      case 400:
        return new AppError(AppErrorType.AUTH, errorTexts.somethingWentWrong);
      default:
        return null;
    }
  },
  resendVerification: (error) => {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const msg = error.response?.data?.msg;
      switch (status) {
        case 400:
          if (msg === "request validation failed") {
            return new AppError(AppErrorType.AUTH, "email format is incorrect");
          } else if (msg === "user already verified") {
            return new AppError(AppErrorType.AUTH, "user already verified");
          }
          return new AppError(AppErrorType.AUTH, errorTexts.invalidRequestBody);
        case 401:
          return new AppError(AppErrorType.AUTH, errorTexts.invalidCredentials);
        default:
          return null;
      }
    }
    return null;
  },
};
