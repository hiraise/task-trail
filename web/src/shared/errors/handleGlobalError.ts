import { toast } from "sonner";
import { GLOBAL_ERRORS } from "./globalErrors";
import { AppError, AppErrorType } from "./types";

export function handleGlobalError(error: unknown) {
  const appError = error as AppError;

  // Skip handling if error is not an AppError or not a global error
  if (!appError?.type || !GLOBAL_ERRORS.includes(appError.type)) {
    return;
  }

  switch (appError.type) {
    case AppErrorType.UNAUTHORIZED:
      toast.error(appError.message);
      break;
    case AppErrorType.NETWORK:
      toast.error(appError.message);
      break;
    case AppErrorType.UNKNOWN:
      toast.error(appError.message);
      break;
  }
}
