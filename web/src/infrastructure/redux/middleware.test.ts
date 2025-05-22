import { Action, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";

import { errorHandlingMiddleware } from "./middleware";
import { AppErrorType } from "@/shared/errors/types";
import {
  requireAuthRedirect,
  setError,
} from "@/application/auth/slices/authSlice";

jest.mock("@reduxjs/toolkit", () => ({
  ...jest.requireActual("@reduxjs/toolkit"),
  isRejectedWithValue: jest.fn(),
}));

import { isRejectedWithValue as _isRejectedWithValue } from "@reduxjs/toolkit";
const isRejectedWithValue = _isRejectedWithValue as jest.MockedFunction<typeof _isRejectedWithValue>;

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

  it("should dispatch requireAuthRedirect on UNAUTHORIZED error", () => {
    // Arrange
    isRejectedWithValue.mockReturnValue(true);
    const action = {
      payload: {
        type: AppErrorType.UNAUTHORIZED,
        message: "Unauthorized",
      },
    };

    // Act
    errorHandlingMiddleware(storeAPI)(next)(action);

    // Assert
    expect(storeAPI.dispatch).toHaveBeenCalledWith(requireAuthRedirect());
    expect(next).toHaveBeenCalledWith(action);
  });

  it("should dispatch setError on other error", () => {
    // Arrange
    isRejectedWithValue.mockReturnValue(true);
    const action = {
      payload: {
        type: AppErrorType.UNKNOWN,
        message: "fail",
      },
    };

    // Act
    errorHandlingMiddleware(storeAPI)(next)(action);

    // Assert
    expect(storeAPI.dispatch).toHaveBeenCalledWith(setError("fail"));
    expect(next).toHaveBeenCalledWith(action);
  });

  it("should pass through non-rejected actions", () => {
    // Arrange
    isRejectedWithValue.mockReturnValue(false);
    const action = { type: "SOME_ACTION" };

    // Act
    errorHandlingMiddleware(storeAPI)(next)(action);

    // Assert
    expect(storeAPI.dispatch).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(action);
  });
});
