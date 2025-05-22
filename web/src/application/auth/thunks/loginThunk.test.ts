import { authService } from "@/infrastructure/api/authService";
import { loginThunk } from "./loginThunk";
import { authPayload } from "@/shared/constants/testConstants";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { errorTexts } from "@/shared/locales/messages";
import { AUTH_LOGIN } from "@/application/constants/actionTypes";

jest.mock("@/infrastructure/api/authService");

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedLogin = mockedAuthService.login;

let thunk: ReturnType<typeof loginThunk>;
let dispatch: jest.Mock;
let getState: jest.Mock;
let extra: unknown = {};

describe("login thunk", () => {
  beforeEach(() => {
    dispatch = jest.fn();
    getState = jest.fn();
    extra = {};
    thunk = loginThunk(authPayload);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches fulfilled when login succeeds", async () => {
    // Arrange
    mockedLogin.mockResolvedValueOnce(undefined);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(mockedLogin).toHaveBeenCalledWith(authPayload);
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${AUTH_LOGIN}/fulfilled`);
  });

  it("dispatches rejected when login fails with AppError", async () => {
    // Arrange
    const error = new AppError(
      AppErrorType.AUTH,
      errorTexts.invalidCredentials
    );
    mockedLogin.mockRejectedValueOnce(error);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(result.payload).toEqual(error.toPlain());
    expect(mockedLogin).toHaveBeenCalledWith(authPayload);
    expect(result.type).toBe(`${AUTH_LOGIN}/rejected`);
  });

  it("returns rejected action with error payload when login fails with non-AppError", async () => {
    // Arrange
    const error = new Error("Network error");
    mockedLogin.mockRejectedValueOnce(error);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(result.type).toBe(`${AUTH_LOGIN}/rejected`);
    expect(mockedLogin).toHaveBeenCalledWith(authPayload);
    expect((result as { error: unknown }).error).toEqual({
      message: "Rejected",
    });
  });
});
