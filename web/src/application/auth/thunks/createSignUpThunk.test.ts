import { authPayload } from "@/shared/constants/testConstants";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { errorTexts } from "@/shared/locales/messages";
import { createSignUpThunk } from "./createSignUpThunk";

const TYPE_PREFIX = "auth/signUp";

describe("signUp thunk", () => {
  let mockSignUp: jest.Mock;
  let thunk: ReturnType<ReturnType<typeof createSignUpThunk>>;
  let dispatch: jest.Mock;
  let getState: jest.Mock;
  let extra: unknown = {};

  beforeEach(() => {
    mockSignUp = jest.fn();
    const signUpThunk = createSignUpThunk(mockSignUp);
    thunk = signUpThunk(authPayload);
    dispatch = jest.fn();
    getState = jest.fn();
    extra = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches fulfilled when signup succeeds", async () => {
    // Arrange
    mockSignUp.mockResolvedValueOnce(undefined);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(dispatch).toHaveBeenCalled();
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith(authPayload);
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${TYPE_PREFIX}/fulfilled`);
  });

  it("dispatches rejected when signup fails with AppError", async () => {
    // Arrange
    const error = new AppError(
      AppErrorType.AUTH,
      errorTexts.invalidCredentials
    );
    mockSignUp.mockRejectedValueOnce(error);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(dispatch).toHaveBeenCalled();
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith(authPayload);
    expect(result.payload).toEqual(error.toPlain());
    expect(result.payload?.type).toBe(AppErrorType.AUTH);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
  });

  it("returns rejected action with error payload when signup fails with non-AppError", async () => {
    // Arrange
    const error = new Error("Network error");
    mockSignUp.mockRejectedValueOnce(error);
    // Act
    const result = await thunk(dispatch, getState, extra);
    // Assert
    expect(dispatch).toHaveBeenCalled();
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    expect(mockSignUp).toHaveBeenCalledWith(authPayload);
    expect(result.payload?.type).toBe(AppErrorType.UNKNOWN);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
    expect((result as { error: unknown }).error).toEqual({
      message: "Rejected",
    });
  });
});
