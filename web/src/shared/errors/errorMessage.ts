import { toast } from "sonner";

import { apiErrorTexts } from "../locales/apiErrors";

import { GLOBAL_ERRORS } from "./globalErrors";
import { AppError } from "./types";

/** Ошибку уже показал общий обработчик запросов (handleGlobalError). */
export const isGlobalError = (error: unknown): error is AppError =>
  error instanceof AppError && GLOBAL_ERRORS.includes(error.type);

/** Текст ошибки для пользователя: по коду API, а если для кода текста нет — `fallback`. */
export function errorMessage(error: unknown, fallback: string): string {
  const code = error instanceof AppError ? error.code : undefined;

  return (code && apiErrorTexts[code]) || fallback;
}

/** Показывает ошибку запроса в тосте, если её не показал общий обработчик. */
export function toastError(error: unknown, fallback: string): void {
  if (isGlobalError(error)) return;

  toast.error(errorMessage(error, fallback));
}
