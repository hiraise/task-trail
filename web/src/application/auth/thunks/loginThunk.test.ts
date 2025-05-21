import { authService } from "@/infrastructure/api/authService";
import { loginThunk } from "./loginThunk";
import { authPayload } from "@/shared/constants/testConstants";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { errorTexts } from "@/shared/locales/messages";
import { AUTH_LOGIN } from "@/application/constants/actionTypes";

jest.mock("@/infrastructure/api/authService");

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe("loginThunk", () => {
  it("dispatches fulfilled when login succeeds", async () => {
    // Arrange
    mockedAuthService.login.mockResolvedValueOnce(undefined);
    const dispatch = jest.fn();
    const getState = jest.fn();
    const extra = {};
    const thunk = loginThunk(authPayload);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(mockedAuthService.login).toHaveBeenCalledWith(authPayload);
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${AUTH_LOGIN}/fulfilled`);
  });

  it("dispatches rejected when login fails with AppError", async () => {
    // Arrange
    const error = new AppError(
      AppErrorType.AUTH,
      errorTexts.invalidCredentials
    );
    mockedAuthService.login.mockRejectedValueOnce(error);
    const dispatch = jest.fn();
    const getState = jest.fn();
    const extra = {};
    const thunk = loginThunk(authPayload);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(result.payload).toEqual(error.toPlain());
    expect(mockedAuthService.login).toHaveBeenCalledWith(authPayload);
    expect(result.type).toBe(`${AUTH_LOGIN}/rejected`);
  });

  it("returns rejected action with error payload when login fails with non-AppError", async () => {
    // Arrange
    const error = new Error("Network error");
    mockedAuthService.login.mockRejectedValueOnce(error);
    const dispatch = jest.fn();
    const getState = jest.fn();
    const extra = {};
    const thunk = loginThunk(authPayload);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(result.type).toBe(`${AUTH_LOGIN}/rejected`);
    expect(mockedAuthService.login).toHaveBeenCalledWith(authPayload);
    expect((result as { error: unknown }).error).toEqual({
      message: "Rejected",
    });
  });
});