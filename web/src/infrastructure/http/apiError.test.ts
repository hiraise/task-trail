import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";

import { AppError, AppErrorType } from "@/shared/errors/types";

import { toAppError } from "./apiError";

const config = { headers: new AxiosHeaders() };

const httpError = (status: number, data: unknown): AxiosError => {
  const response: AxiosResponse = { status, statusText: "", data, headers: {}, config };

  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, {}, response);
};

describe("toAppError", () => {
  it("берёт код и подробности из ApiError", () => {
    const error = toAppError(
      httpError(422, {
        code: "VALIDATION_FAILED",
        message: "invalid body",
        details: { newPassword: "too short" },
      }),
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error.type).toBe(AppErrorType.VALIDATION);
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.details).toEqual({ newPassword: "too short" });
  });

  it("неверный пароль при входе — ошибка формы, а не истёкшая сессия", () => {
    const error = toAppError(
      httpError(401, { code: "INVALID_CREDENTIALS", message: "bad", details: null }),
    );

    expect(error.type).toBe(AppErrorType.AUTH);
    expect(error.code).toBe("INVALID_CREDENTIALS");
    expect(error.details).toBeUndefined();
  });

  it("UNAUTHENTICATED — истёкшая сессия", () => {
    const error = toAppError(
      httpError(401, { code: "UNAUTHENTICATED", message: "no session", details: null }),
    );

    expect(error.type).toBe(AppErrorType.UNAUTHORIZED);
  });

  it("ответ без ApiError — тип по статусу, без кода", () => {
    const error = toAppError(httpError(502, "<html>Bad Gateway</html>"));

    expect(error.type).toBe(AppErrorType.SERVER);
    expect(error.code).toBeUndefined();
  });

  it("тайм-аут и обрыв сети различаются", () => {
    expect(toAppError(new AxiosError("timeout", "ECONNABORTED", config)).type).toBe(
      AppErrorType.TIMEOUT,
    );
    expect(toAppError(new AxiosError("Network Error", "ERR_NETWORK", config)).type).toBe(
      AppErrorType.NETWORK,
    );
  });

  it("AppError возвращает как есть", () => {
    const original = new AppError(AppErrorType.VALIDATION, "local", { code: "FILE_TOO_LARGE" });

    expect(toAppError(original)).toBe(original);
  });
});
