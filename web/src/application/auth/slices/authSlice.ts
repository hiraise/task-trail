import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { loginThunk, logoutThunk, signUpThunk } from "../thunks/authThunks";
import { handleAsyncThunkCases } from "@/shared/utils/handleAsyncThunkCases";

export interface AuthState {
  loading: boolean;
  error: string | null;
  shouldRedirectToLogin: boolean;
}

const initialState: AuthState = {
  loading: false,
  error: null,
  shouldRedirectToLogin: false,
};

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
    handleAsyncThunkCases(builder, loginThunk);
    handleAsyncThunkCases(builder, logoutThunk);
    handleAsyncThunkCases(builder, signUpThunk);
  },
});

export const { requireAuthRedirect, resetRedirect, setError, clearError } =
  authSlice.actions;
export default authSlice.reducer;
