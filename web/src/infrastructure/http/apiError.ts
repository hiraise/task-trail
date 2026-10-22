import { isAxiosError } from "axios";

import { AppError, AppErrorType, type ApiErrorCode } from "@/shared/errors/types";

import type { ApiError, ErrorCode } from "../api/generated";

// Коды веба и контракта — один набор: разошлись — сборка падает на этой строке
// (shared/errors/types.ts, ApiErrorCode).
type SameSet<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const codesMatchContract: SameSet<ErrorCode, ApiErrorCode> = true;

void codesMatchContract;

const isApiError = (body: unknown): body is ApiError =>
  typeof body === "object" && body !== null && typeof (body as ApiError).code === "string";

// Тип ошибки решает, кто её показывает: UNAUTHORIZED, NETWORK, TIMEOUT и UNKNOWN —
// общий обработчик (shared/errors/globalErrors.ts), остальные — экран, который сделал запрос.
// Неверный пароль при входе — тоже 401, но это ошибка формы, а не истёкшая сессия.
const typeOf = (status: number, code?: ErrorCode): AppErrorType => {
  if (code === "UNAUTHENTICATED") return AppErrorType.UNAUTHORIZED;
  if (status === 401) return AppErrorType.AUTH;
  if (status === 403) return AppErrorType.FORBIDDEN;
  if (status === 404) return AppErrorType.NOT_FOUND;
  if (status === 409 || status === 422) return AppErrorType.VALIDATION;

  return AppErrorType.SERVER;
};

/** Переводит ошибку HTTP-клиента в AppError с кодом и подробностями из ApiError (ADR-0018). */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (!isAxiosError(error)) {
    return new AppError(AppErrorType.UNKNOWN, String(error), { cause: error });
  }

  const { response } = error;

  if (!response) {
    const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

    return new AppError(timedOut ? AppErrorType.TIMEOUT : AppErrorType.NETWORK, error.message, {
      cause: error,
    });
  }

  const body: unknown = response.data;

  if (!isApiError(body)) {
    return new AppError(typeOf(response.status), error.message, { cause: error });
  }

  return new AppError(typeOf(response.status, body.code), body.message, {
    code: body.code,
    details: body.details ?? undefined,
    cause: error,
  });
}
