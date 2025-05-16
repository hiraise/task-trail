import { AxiosError } from "axios";

import { AppError, AppErrorType } from "./types";
import { errorTexts } from "../locales/messages";

export function handleGlobalHttpError(error: unknown): AppError | null {
  const axiosError = error as AxiosError;

  if (!axiosError?.response) {
    return new AppError(AppErrorType.NETWORK, errorTexts.networkProblem);
  }

  if (axiosError.response.status === 401) {
    return new AppError(AppErrorType.UNAUTHORIZED, errorTexts.sessionExpired);
  }

  if (axiosError.response.status >= 500) {
    return new AppError(AppErrorType.SERVER, errorTexts.serverError);
  }

  return null;
}
