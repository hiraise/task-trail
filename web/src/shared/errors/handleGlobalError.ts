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

/** Показывает ошибки запросов, общие для всех экранов: сессия, сеть, тайм-аут, неизвестная. */
export function handleGlobalError(error: unknown) {
  if (!isGlobalError(error)) return;

  toast.error(globalErrorTexts[error.type] ?? errorTexts.unknownError);
}
