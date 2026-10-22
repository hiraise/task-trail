import { toast } from "sonner";

import { errorTexts } from "../locales/messages";

import { isGlobalError } from "./errorMessage";
import { AppErrorType } from "./types";

const globalErrorTexts: Partial<Record<AppErrorType, string>> = {
  [AppErrorType.UNAUTHORIZED]: errorTexts.sessionExpired,
  [AppErrorType.NETWORK]: errorTexts.networkProblem,
  [AppErrorType.TIMEOUT]: errorTexts.timeout,
  [AppErrorType.UNKNOWN]: errorTexts.unknownError,
};

/** Shows request errors common to all screens: session, network, timeout, unknown. */
export function handleGlobalError(error: unknown) {
  if (!isGlobalError(error)) return;

  toast.error(globalErrorTexts[error.type] ?? errorTexts.unknownError);
}
