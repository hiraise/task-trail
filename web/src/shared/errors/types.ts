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

// API error codes — the contract's `ErrorCode` (ADR-0018). The generated type is not imported
// outside infrastructure (ADR-0020), so the list is repeated here, and infrastructure/http/apiError.ts
// checks it matches the contract at build time: add a code to the contract — add it here.
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
  | "PROJECT_KEY_TAKEN"
  | "FILE_TOO_LARGE"
  | "FILE_TYPE_NOT_ALLOWED"
  | "MAIL_DISABLED"
  | "MAIL_SEND_FAILED"
  | "MAIL_CONNECTION_FAILED"
  | "SECRET_REQUIRED"
  | "INTERNAL";

interface AppErrorOptions {
  /** Code from the API response; network errors and the web's own errors have none */
  code?: ApiErrorCode;
  /** Request field → what is wrong with it; only for VALIDATION_FAILED */
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
