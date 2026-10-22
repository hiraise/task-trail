export const AppErrorType = {
  UNAUTHORIZED: "unauthorized",
  AUTH: "auth",
  NETWORK: "network",
  TIMEOUT: "timeout",
  SERVER: "server",
  UNKNOWN: "unknown",
  VALIDATION: "validation",
  NOT_FOUND: "not found",
  FORBIDDEN: "forbidden",
} as const;

export type AppErrorType = (typeof AppErrorType)[keyof typeof AppErrorType];

// Коды ошибок API — `ErrorCode` контракта (ADR-0018). Сгенерированный тип вне infrastructure
// не импортируется (ADR-0020), поэтому список повторён здесь, а совпадение с контрактом
// проверяет infrastructure/http/apiError.ts при сборке: добавили код в контракт — добавь сюда.
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "REGISTRATION_CLOSED"
  | "WRONG_PASSWORD"
  | "PASSWORD_SAME_AS_OLD"
  | "LINK_INVALID"
  | "INVITATION_ACCEPTED"
  | "ASSIGNEE_NOT_MEMBER"
  | "OWNER_CANNOT_LEAVE"
  | "LAST_ADMIN"
  | "FILE_TOO_LARGE"
  | "FILE_TYPE_NOT_ALLOWED"
  | "MAIL_DISABLED"
  | "MAIL_SEND_FAILED"
  | "MAIL_CONNECTION_FAILED"
  | "SECRET_REQUIRED"
  | "INTERNAL";

interface AppErrorOptions {
  /** Код из ответа API; у сетевых ошибок и ошибок самого веба его нет */
  code?: ApiErrorCode;
  /** Поле запроса → что с ним не так; только у VALIDATION_FAILED */
  details?: Record<string, string>;
  cause?: unknown;
}

export class AppError extends Error {
  type: AppErrorType;
  code?: ApiErrorCode;
  details?: Record<string, string>;

  constructor(type: AppErrorType, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.type = type;
    this.code = options.code;
    this.details = options.details;
    this.name = "AppError";
  }
}

export const hasErrorCode = (error: unknown, code: ApiErrorCode): boolean =>
  error instanceof AppError && error.code === code;
