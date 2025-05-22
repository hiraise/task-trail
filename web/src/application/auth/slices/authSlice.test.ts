import reducer, {
  requireAuthRedirect,
  resetRedirect,
  setError,
  clearError,
} from "./authSlice";
import { loginThunk } from "../thunks/loginThunk";
import { signUpThunk } from "../thunks/signUpThunk";
import { AppErrorProps, AppErrorType } from "@/shared/errors/types";

describe("authSlice", () => {
  const initialState = {
    loading: false,
    error: null,
    shouldRedirectToLogin: false,
  };

  it("should return the initial state", () => {
    // Arrange & Act
    const state = reducer(undefined, { type: "" });
    // Assert
    expect(state).toEqual(initialState);
  });

  it("should handle requireAuthRedirect", () => {
    // Arrange
    const stateBefore = { ...initialState };
    // Act
    const state = reducer(stateBefore, requireAuthRedirect());
    // Assert
    expect(state.shouldRedirectToLogin).toBe(true);
  });

  it("should handle resetRedirect", () => {
    // Arrange
    const stateBefore = { ...initialState, shouldRedirectToLogin: true };
    // Act
    const state = reducer(stateBefore, resetRedirect());
    // Assert
    expect(state.shouldRedirectToLogin).toBe(false);
  });

  it("should handle setError", () => {
    // Arrange
    const stateBefore = { ...initialState };
    // Act
    const state = reducer(stateBefore, setError("Ошибка"));
    // Assert
    expect(state.error).toBe("Ошибка");
  });

  it("should handle clearError", () => {
    // Arrange
    const stateBefore = { ...initialState, error: "Ошибка" };
    // Act
    const state = reducer(stateBefore, clearError());
    // Assert
    expect(state.error).toBeNull();
  });

  describe("loginThunk", () => {
    it("should handle loginThunk.pending", () => {
      // Arrange
      const stateBefore = { ...initialState };
      const action = { type: loginThunk.pending.type };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should handle loginThunk.fulfilled", () => {
      // Arrange
      const stateBefore = { ...initialState, loading: true };
      const action = { type: loginThunk.fulfilled.type };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(false);
    });

    it("should handle loginThunk.rejected with message", () => {
      // Arrange
      const stateBefore = { ...initialState, loading: true };
      const error: AppErrorProps = { type: AppErrorType.AUTH, message: "Ошибка входа" };
      const action = {
        type: loginThunk.rejected.type,
        payload: error,
      };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Ошибка входа");
    });

    it("should handle loginThunk.rejected without message", () => {
      // Arrange
      const stateBefore = { ...initialState, loading: true };
      const action = {
        type: loginThunk.rejected.type,
        payload: undefined,
      };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Неизвестная ошибка");
    });
  });

  describe("signUpThunk", () => {
    it("should handle signUpThunk.pending", () => {
      // Arrange
      const stateBefore = { ...initialState };
      const action = { type: signUpThunk.pending.type };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should handle signUpThunk.fulfilled", () => {
      // Arrange
      const stateBefore = { ...initialState, loading: true };
      const action = { type: signUpThunk.fulfilled.type };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(false);
    });

    it("should handle signUpThunk.rejected with message", () => {
      // Arrange
      const stateBefore = { ...initialState, loading: true };
      const error: AppErrorProps = { type: AppErrorType.AUTH, message: "Ошибка регистрации" };
      const action = {
        type: signUpThunk.rejected.type,
        payload: error,
      };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Ошибка регистрации");
    });

    it("should handle signUpThunk.rejected without message", () => {
      // Arrange
      const stateBefore = { ...initialState, loading: true };
      const action = {
        type: signUpThunk.rejected.type,
        payload: undefined,
      };
      // Act
      const state = reducer(stateBefore, action);
      // Assert
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Неизвестная ошибка");
    });
  });
});