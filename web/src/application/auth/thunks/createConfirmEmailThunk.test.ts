import { AppError, AppErrorType } from "@/shared/errors/types";
import { createConfirmEmailThunk } from "./createConfirmEmailThunk";
import { errorTexts } from "@/shared/locales/messages";

const TYPE_PREFIX = "auth/confirmEmail";

describe("confirmEmail thunk", () => {
  let mockVerifyEmail: jest.Mock;
  let thunk: ReturnType<ReturnType<typeof createConfirmEmailThunk>>;
  let dispatch: jest.Mock;
  let getState: jest.Mock;
  let extra: unknown = {};
  let token: string;

  beforeEach(() => {
    mockVerifyEmail = jest.fn();
    token = "test-token";
    const confirmEmailThunk = createConfirmEmailThunk(mockVerifyEmail);
    thunk = confirmEmailThunk(token);
    dispatch = jest.fn();
    getState = jest.fn();
    extra = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches fulfilled when email confirmation succeeds", async () => {
    mockVerifyEmail.mockResolvedValueOnce(undefined);
    const result = await thunk(dispatch, getState, extra);
    expect(mockVerifyEmail).toHaveBeenCalledWith(token);
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${TYPE_PREFIX}/fulfilled`);
  });

  it("dispatches rejected when email confirmation fails with AppError", async () => {
    const error = new AppError(
      AppErrorType.AUTH,
      errorTexts.somethingWentWrong
    );
    mockVerifyEmail.mockRejectedValueOnce(error);
    const result = await thunk(dispatch, getState, extra);
    expect(result.payload).toEqual(error.toPlain());
    expect(mockVerifyEmail).toHaveBeenCalledWith(token);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
  });

  it("dispatches rejected when email confirmation fails with unknown error", async () => {
    const error = new Error("Network error");
    mockVerifyEmail.mockRejectedValueOnce(error);
    const result = await thunk(dispatch, getState, extra);
    expect(mockVerifyEmail).toHaveBeenCalledWith(token);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
    expect((result as { error: unknown }).error).toEqual({
      message: "Rejected",
    });
  });
});
