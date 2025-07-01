import { AppError, AppErrorType } from "@/shared/errors/types";
import { createResendVerificationThunk } from "./createResendVerificationThunk";
import { errorTexts } from "@/shared/locales/messages";

const TYPE_PREFIX = "auth/resendVerification";

describe("resendVerification thunk", () => {
  let mockResendVerification: jest.Mock;
  let thunk: ReturnType<ReturnType<typeof createResendVerificationThunk>>;
  let dispatch: jest.Mock;
  let getState: jest.Mock;
  let extra: unknown = {};
  let email: string;

  beforeEach(() => {
    mockResendVerification = jest.fn();
    email = "test@example.com";
    const resendVerificationThunk = createResendVerificationThunk(
      mockResendVerification
    );
    thunk = resendVerificationThunk(email);
    dispatch = jest.fn();
    getState = jest.fn();
    extra = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches fulfilled when resend verification succeeds", async () => {
    mockResendVerification.mockResolvedValueOnce(email);
    const result = await thunk(dispatch, getState, extra);
    expect(mockResendVerification).toHaveBeenCalledWith(email);
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${TYPE_PREFIX}/fulfilled`);
  });

  it("dispatches rejected when resend verification fails with AppError", async () => {
    const error = new AppError(
      AppErrorType.AUTH,
      errorTexts.somethingWentWrong
    );
    mockResendVerification.mockRejectedValueOnce(error);
    const result = await thunk(dispatch, getState, extra);
    expect(result.payload).toEqual(error.toPlain());
    expect(mockResendVerification).toHaveBeenCalledWith(email);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
  });

  it("dispatches rejected when resend verification fails with unknown error", async () => {
    const error = new Error("Network error");
    mockResendVerification.mockRejectedValueOnce(error);
    const result = await thunk(dispatch, getState, extra);
    expect(mockResendVerification).toHaveBeenCalledWith(email);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
    expect((result as { error: unknown }).error).toEqual({
      message: "Rejected",
    });
  });
});
