import { AppErrorType } from "./types";

// Errors shown by the global handler (handleGlobalError), not by the requesting screen.
export const GLOBAL_ERRORS: AppErrorType[] = [
  AppErrorType.UNAUTHORIZED,
  AppErrorType.NETWORK,
  AppErrorType.TIMEOUT,
  AppErrorType.UNKNOWN,
];
