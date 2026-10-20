export const AppErrorType = {
  UNAUTHORIZED: "unauthorized",
  AUTH: "auth",
  NETWORK: "network",
  SERVER: "server",
  UNKNOWN: "unknown",
  VALIDATION: "validation",
  NOT_FOUND: "not found",
  FORBIDDEN: "forbidden",
} as const;

export type AppErrorType = (typeof AppErrorType)[keyof typeof AppErrorType];

export interface AppErrorProps {
  type: AppErrorType;
  message: string;
}

export class AppError extends Error {
  type: AppErrorType;

  constructor(type: AppErrorType, message: string) {
    super(message);
    this.type = type;
    this.name = "AppError";
  }
}
