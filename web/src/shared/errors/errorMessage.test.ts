import { errorMessage, isGlobalError } from "./errorMessage";
import { AppError, AppErrorType } from "./types";

describe("errorMessage", () => {
  it("text by API code", () => {
    const error = new AppError(AppErrorType.AUTH, "bad credentials", {
      code: "INVALID_CREDENTIALS",
    });

    expect(errorMessage(error, "запасной")).toBe("Неверная почта или пароль");
  });

  it("a code without text and a foreign error — fallback text", () => {
    const internal = new AppError(AppErrorType.SERVER, "boom", { code: "INTERNAL" });

    expect(errorMessage(internal, "запасной")).toBe("запасной");
    expect(errorMessage(new Error("x"), "запасной")).toBe("запасной");
  });
});

describe("isGlobalError", () => {
  it("the global handler shows network and session errors, the screen shows form errors", () => {
    expect(isGlobalError(new AppError(AppErrorType.NETWORK, "offline"))).toBe(true);
    expect(isGlobalError(new AppError(AppErrorType.UNAUTHORIZED, "expired"))).toBe(true);
    expect(isGlobalError(new AppError(AppErrorType.VALIDATION, "invalid"))).toBe(false);
  });
});
