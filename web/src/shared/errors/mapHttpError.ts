import { errorTexts } from "../locales/messages";
import { handleGlobalHttpError } from "./handleGlobalHttpError";
import { localErrorHandlers } from "./handleLocalAuthError";
import { AppError, AppErrorType } from "./types";

export enum Domain {
  AUTH = "auth",
}

type LocalErrorHandler = (error: unknown) => AppError | null;

const localHandlers: Record<Domain, LocalErrorHandler> = {
  auth: localErrorHandlers.signUp,
};

export function mapHttpError(error: unknown, domain: Domain): AppError {
  const globalError = handleGlobalHttpError(error);
  if (globalError) return globalError;

  const localErrorHandler = localHandlers[domain];
  const localError = localErrorHandler?.(error);
  if (localError) return localError;

  return new AppError(AppErrorType.UNKNOWN, errorTexts.unknownError);
}
