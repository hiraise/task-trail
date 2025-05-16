export enum AppErrorType {
  UNAUTHORIZED = "unauthorized",
  AUTH = "auth",
  NETWORK = "network",
  SERVER = "server",
  UNKNOWN = "unknown",
}

export interface AppErrorProps {
  type: AppErrorType;
  message: string;
}

export class AppError extends Error {
  constructor(public type: AppErrorType, message: string) {
    super(message);
    this.name = "AppError";
  }

  toPlain(): AppErrorProps {
    return {
      type: this.type,
      message: this.message,
    };
  }
}
