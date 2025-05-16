import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  loading: boolean;
  error: string | null;
  shouldRedirectToLogin: boolean;
}

const initialState: AuthState = {
  loading: false,
  error: null,
  shouldRedirectToLogin: false,
};

import { loginThunk } from "../thunks/loginThunk";
import { signUpThunk } from "../thunks/signUpThunk";
import { AppErrorProps } from "@/shared/errors/types";

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    requireAuthRedirect: (state) => {
      state.shouldRedirectToLogin = true;
    },
    resetRedirect: (state) => {
      state.shouldRedirectToLogin = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(
        loginThunk.rejected,
        (state, action: PayloadAction<AppErrorProps | undefined>) => {
          state.loading = false;
          state.error = action.payload?.message || "Неизвестная ошибка";
        }
      );
    // Sign Up
    builder
      .addCase(signUpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(
        signUpThunk.rejected,
        (state, action: PayloadAction<AppErrorProps | undefined>) => {
          state.loading = false;
          state.error = action.payload?.message || "Неизвестная ошибка";
        }
      );
  },
});

export const { requireAuthRedirect, resetRedirect, setError, clearError } =
  authSlice.actions;
export default authSlice.reducer;
