import { AppError, AppErrorProps, AppErrorType } from "../errors/types";

export function handleThunkError<T>(
  error: unknown,
  rejectCallback: (value: AppErrorProps) => T
): T {
  if (error instanceof AppError) {
    return rejectCallback(error.toPlain());
  }
  const message = (error as Error)?.message ?? "Unknown error";
  return rejectCallback({
    type: AppErrorType.UNKNOWN,
    message: message,
  });
}
