export enum AppErrorType {
  UNAUTHORIZED = "unauthorized",
  AUTH = "auth",
  NETWORK = "network",
  SERVER = "server",
  UNKNOWN = "unknown",
  VALIDATION = "validation",
  NOT_FOUND = "not found",
  FORBIDDEN = "forbidden",
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

/**
 * Domain Error for business rule violations
 *
 * Используется в доменном слое для сигнализации о нарушении бизнес-правил.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
