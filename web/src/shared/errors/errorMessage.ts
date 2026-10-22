import { toast } from "sonner";

import { apiErrorTexts } from "../locales/apiErrors";

import { GLOBAL_ERRORS } from "./globalErrors";
import { AppError } from "./types";

/** The error has already been shown by the global request handler (handleGlobalError). */
export const isGlobalError = (error: unknown): error is AppError =>
  error instanceof AppError && GLOBAL_ERRORS.includes(error.type);

/** User-facing error text: by API code, or `fallback` if the code has no text. */
export function errorMessage(error: unknown, fallback: string): string {
  const code = error instanceof AppError ? error.code : undefined;

  return (code && apiErrorTexts[code]) || fallback;
}

/** Shows a request error in a toast unless the global handler has shown it. */
export function toastError(error: unknown, fallback: string): void {
  if (isGlobalError(error)) return;

  toast.error(errorMessage(error, fallback));
}
