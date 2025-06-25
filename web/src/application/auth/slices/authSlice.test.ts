import reducer, {
  requireAuthRedirect,
  resetRedirect,
  setError,
  clearError,
  AuthState,
} from "./authSlice";

import { AppErrorProps, AppErrorType } from "@/shared/errors/types";
import { loginThunk, logoutThunk, signUpThunk } from "../thunks/authThunks";

/**
 * Props for testing thunk action cases in authentication slice tests.
 *
 * @property thunk - An object containing the action types for the thunk's pending, fulfilled, and rejected states.
 * @property thunk.pending - The action type string for the pending state.
 * @property thunk.fulfilled - The action type string for the fulfilled state.
 * @property thunk.rejected - The action type string for the rejected state.
 * @property initialState - The initial authentication state before the thunk is dispatched.
 * @property errorMessage - The error message expected when the thunk is rejected.
 */
interface ThunkCasesProps {
  thunk: {
    pending: { type: string };
    fulfilled: { type: string };
    rejected: { type: string };
  };
  initialState: AuthState;
  errorMessage: string;
}

/**
 * Runs a suite of unit tests for Redux thunk action cases (pending, fulfilled, rejected)
 * against a given reducer and initial state. This helper function verifies that the reducer
 * correctly updates the loading and error state properties in response to each thunk action type.
 *
 * @param params - The parameters for the test cases.
 * @param params.thunk - The thunk action creator object containing `pending`, `fulfilled`, and `rejected` action types.
 * @param params.initialState - The initial state of the reducer before any actions are dispatched.
 * @param params.errorMessage - The expected error message to be set in the state when the thunk is rejected with an error.
 *
 * @example
 * testThunkCases({
 *   thunk: myAsyncThunk,
 *   initialState: { loading: false, error: null },
 *   errorMessage: "Some error occurred"
 * });
 */
function testThunkCases({
  thunk,
  initialState,
  errorMessage,
}: ThunkCasesProps) {
  it(`should handle ${thunk.pending.type}`, () => {
    const state = reducer(initialState, { type: thunk.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it(`should handle ${thunk.fulfilled.type}`, () => {
    const stateBefore = { ...initialState, loading: true };
    const state = reducer(stateBefore, { type: thunk.fulfilled.type });
    expect(state.loading).toBe(false);
  });

  it(`should handle ${thunk.rejected.type} with message`, () => {
    const stateBefore = { ...initialState, loading: true };
    const error: AppErrorProps = {
      type: AppErrorType.AUTH,
      message: errorMessage,
    };
    const state = reducer(stateBefore, {
      type: thunk.rejected.type,
      payload: error,
    });
    expect(state.loading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  it(`should handle ${thunk.rejected.type} without message`, () => {
    const stateBefore = { ...initialState, loading: true };
    const state = reducer(stateBefore, {
      type: thunk.rejected.type,
      payload: undefined,
    });
    expect(state.loading).toBe(false);
    expect(state.error).toBe("Неизвестная ошибка");
  });
}

describe("authSlice", () => {
  const initialState = {
    loading: false,
    error: null,
    shouldRedirectToLogin: false,
  };

  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "" });
    expect(state).toEqual(initialState);
  });

  it("should handle requireAuthRedirect", () => {
    const stateBefore = { ...initialState };
    const state = reducer(stateBefore, requireAuthRedirect());
    expect(state.shouldRedirectToLogin).toBe(true);
  });

  it("should handle resetRedirect", () => {
    const stateBefore = { ...initialState, shouldRedirectToLogin: true };
    const state = reducer(stateBefore, resetRedirect());
    expect(state.shouldRedirectToLogin).toBe(false);
  });

  it("should handle setError", () => {
    const stateBefore = { ...initialState };
    const state = reducer(stateBefore, setError("Ошибка"));
    expect(state.error).toBe("Ошибка");
  });

  it("should handle clearError", () => {
    const stateBefore = { ...initialState, error: "Ошибка" };
    const state = reducer(stateBefore, clearError());
    expect(state.error).toBeNull();
  });

  describe("loginThunk", () => {
    testThunkCases({
      thunk: loginThunk,
      initialState,
      errorMessage: "Ошибка входа",
    });
  });

  describe("logoutThunk", () => {
    testThunkCases({
      thunk: logoutThunk,
      initialState,
      errorMessage: "Ошибка выхода",
    });
  });

  describe("signUpThunk", () => {
    testThunkCases({
      thunk: signUpThunk,
      initialState,
      errorMessage: "Ошибка регистрации",
    });
  });
});
