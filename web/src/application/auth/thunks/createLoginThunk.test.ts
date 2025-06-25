import { createLoginThunk } from "./createLoginThunk";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { errorTexts } from "@/shared/locales/messages";
import { authPayload } from "@/shared/constants/testConstants";

const TYPE_PREFIX = "auth/login";

describe("login thunk", () => {
  let mockLogin: jest.Mock;
  let thunk: ReturnType<ReturnType<typeof createLoginThunk>>;
  let dispatch: jest.Mock;
  let getState: jest.Mock;
  let extra: unknown = {};

  beforeEach(() => {
    mockLogin = jest.fn();
    const loginThunk = createLoginThunk(mockLogin);
    thunk = loginThunk(authPayload);
    dispatch = jest.fn();
    getState = jest.fn();
    extra = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches fulfilled when login succeeds", async () => {
    // Arrange
    mockLogin.mockResolvedValueOnce(undefined);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(mockLogin).toHaveBeenCalledWith(authPayload);
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${TYPE_PREFIX}/fulfilled`);
  });

  it("dispatches rejected when login fails with AppError", async () => {
    // Arrange
    const error = new AppError(
      AppErrorType.AUTH,
      errorTexts.invalidCredentials
    );
    mockLogin.mockRejectedValueOnce(error);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(result.payload).toEqual(error.toPlain());
    expect(mockLogin).toHaveBeenCalledWith(authPayload);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
  });

  it("returns rejected action with error payload when login fails with non-AppError", async () => {
    // Arrange
    const error = new Error("Network error");
    mockLogin.mockRejectedValueOnce(error);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
    expect(mockLogin).toHaveBeenCalledWith(authPayload);
    expect((result as { error: unknown }).error).toEqual({
      message: "Rejected",
    });
  });
});
