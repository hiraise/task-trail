import { Action, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";

import { errorHandlingMiddleware } from "./middleware";
import { AppError, AppErrorType } from "@/shared/errors/types";

jest.mock("@reduxjs/toolkit", () => ({
  ...jest.requireActual("@reduxjs/toolkit"),
  isRejectedWithValue: jest.fn(),
}));

import { isRejectedWithValue as _isRejectedWithValue } from "@reduxjs/toolkit";
import { addError } from "@/application/errors/slices/errorSlice";
const isRejectedWithValue = _isRejectedWithValue as jest.MockedFunction<
  typeof _isRejectedWithValue
>;

describe("errorHandlingMiddleware", () => {
  let storeAPI: Partial<MiddlewareAPI<Dispatch<Action>>>;
  let next: jest.Mock;
  let dispatch: jest.Mock;
  let getState: jest.Mock;

  beforeEach(() => {
    getState = jest.fn();
    dispatch = jest.fn();
    next = jest.fn();
    storeAPI = { dispatch, getState };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should dispatch addError on UNAUTHORIZED error", () => {
    isRejectedWithValue.mockReturnValue(true);
    const error = new AppError(AppErrorType.UNAUTHORIZED, "Unauthorized");
    const action = { payload: error };
    errorHandlingMiddleware(storeAPI)(next)(action);
    expect(storeAPI.dispatch).toHaveBeenCalledWith(addError(error));
    expect(next).toHaveBeenCalledWith(action);
  });

  test("should dispatch addError on other error", () => {
    isRejectedWithValue.mockReturnValue(true);
    const error = new AppError(AppErrorType.UNKNOWN, "fail");
    const action = { payload: error };
    errorHandlingMiddleware(storeAPI)(next)(action);
    expect(storeAPI.dispatch).toHaveBeenCalledWith(addError(error));
    expect(next).toHaveBeenCalledWith(action);
  });

  test("should pass through non-rejected actions", () => {
    isRejectedWithValue.mockReturnValue(false);
    const action = { type: "SOME_ACTION" };
    errorHandlingMiddleware(storeAPI)(next)(action);
    expect(storeAPI.dispatch).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  test("should not dispatch addError if error type is not in GLOBAL_ERRORS", () => {
    isRejectedWithValue.mockReturnValue(true);
    const error = new AppError("SOME_OTHER_TYPE" as AppErrorType, "Not global");
    const action = { payload: error };
    errorHandlingMiddleware(storeAPI)(next)(action);
    expect(storeAPI.dispatch).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  test("should not dispatch addError if error is not an AppError", () => {
    isRejectedWithValue.mockReturnValue(true);
    const action = { payload: { foo: "bar" } };
    errorHandlingMiddleware(storeAPI)(next)(action);
    expect(storeAPI.dispatch).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });

  test("should dispatch addError for NETWORK error", () => {
    isRejectedWithValue.mockReturnValue(true);
    const error = new AppError(AppErrorType.NETWORK, "Network error");
    const action = { payload: error };
    errorHandlingMiddleware(storeAPI)(next)(action);
    expect(storeAPI.dispatch).toHaveBeenCalledWith(addError(error));
    expect(next).toHaveBeenCalledWith(action);
  });
});
