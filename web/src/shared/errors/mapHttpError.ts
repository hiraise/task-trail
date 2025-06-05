import { errorTexts } from "../locales/messages";
import { handleGlobalHttpError } from "./handleGlobalHttpError";
import { localErrorHandlers } from "./handleLocalAuthError";
import { AppError, AppErrorType } from "./types";

export enum Domain {
  LOGIN = "login",
  SIGNUP = "signup",
  RESEND_VERIFICATION = "resendVerification",
  CONFIRM_EMAIL = "confirmEmail",
}

type LocalErrorHandler = (error: unknown) => AppError | null;

const localHandlers: Record<Domain, LocalErrorHandler> = {
  login: localErrorHandlers.login,
  signup: localErrorHandlers.signUp,
  resendVerification: localErrorHandlers.resendVerification,
  confirmEmail: localErrorHandlers.confirmEmail,
};

export function mapHttpError(error: unknown, domain: Domain): AppError {
  const localError = localHandlers[domain]?.(error);
  if (localError) return localError;

  const globalError = handleGlobalHttpError(error);
  if (globalError) return globalError;

  return new AppError(AppErrorType.UNKNOWN, errorTexts.unknownError);
}
