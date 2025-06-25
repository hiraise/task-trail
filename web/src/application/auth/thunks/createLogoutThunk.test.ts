import { AppError, AppErrorType } from "@/shared/errors/types";
import { errorTexts } from "@/shared/locales/messages";
import { createLogoutThunk } from "./createLogoutThunk";

const TYPE_PREFIX = "auth/logout";

describe("logout thunk", () => {
  let mockLogout: jest.Mock;
  let thunk: ReturnType<ReturnType<typeof createLogoutThunk>>;
  let dispatch: jest.Mock;
  let getState: jest.Mock;
  let extra: unknown = {};

  beforeEach(() => {
    mockLogout = jest.fn();
    const logoutThunk = createLogoutThunk(mockLogout);
    thunk = logoutThunk();
    dispatch = jest.fn();
    getState = jest.fn();
    extra = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches fulfilled when logout succeeds", async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    const result = await thunk(dispatch, getState, extra);
    expect(mockLogout).toHaveBeenCalledWith();
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${TYPE_PREFIX}/fulfilled`);
  });

  it("dispatches rejected when logout fails with AppError", async () => {
    const error = new AppError(
      AppErrorType.AUTH,
      errorTexts.authenticationRequired
    );
    mockLogout.mockRejectedValueOnce(error);
    const result = await thunk(dispatch, getState, extra);
    expect(result.payload).toEqual(error.toPlain());
    expect(mockLogout).toHaveBeenCalledWith();
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
  });

  it("returns rejected action with error payload when logout fails with non-AppError", async () => {
    const error = new Error("Network error");
    mockLogout.mockRejectedValueOnce(error);
    const result = await thunk(dispatch, getState, extra);
    expect(result.type).toBe(`${TYPE_PREFIX}/rejected`);
    expect(mockLogout).toHaveBeenCalledWith();
    expect((result as { error: unknown }).error).toEqual({
      message: "Rejected",
    });
  });
});
