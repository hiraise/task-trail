import { AppErrorType } from "./types";

// Ошибки, которые показывает общий обработчик (handleGlobalError), а не экран запроса.
export const GLOBAL_ERRORS: AppErrorType[] = [
  AppErrorType.UNAUTHORIZED,
  AppErrorType.NETWORK,
  AppErrorType.TIMEOUT,
  AppErrorType.UNKNOWN,
];
