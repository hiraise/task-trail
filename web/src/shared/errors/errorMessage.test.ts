import { errorMessage, isGlobalError } from "./errorMessage";
import { AppError, AppErrorType } from "./types";

describe("errorMessage", () => {
  it("текст по коду API", () => {
    const error = new AppError(AppErrorType.AUTH, "bad credentials", {
      code: "INVALID_CREDENTIALS",
    });

    expect(errorMessage(error, "запасной")).toBe("Неверная почта или пароль");
  });

  it("код без текста и чужая ошибка — запасной текст", () => {
    const internal = new AppError(AppErrorType.SERVER, "boom", { code: "INTERNAL" });

    expect(errorMessage(internal, "запасной")).toBe("запасной");
    expect(errorMessage(new Error("x"), "запасной")).toBe("запасной");
  });
});

describe("isGlobalError", () => {
  it("сеть и сессию показывает общий обработчик, ошибки формы — экран", () => {
    expect(isGlobalError(new AppError(AppErrorType.NETWORK, "offline"))).toBe(true);
    expect(isGlobalError(new AppError(AppErrorType.UNAUTHORIZED, "expired"))).toBe(true);
    expect(isGlobalError(new AppError(AppErrorType.VALIDATION, "invalid"))).toBe(false);
  });
});
