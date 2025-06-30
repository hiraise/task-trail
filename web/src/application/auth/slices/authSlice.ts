import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  checkAuthStatusThunk,
  loginThunk,
  logoutThunk,
  signUpThunk,
} from "../thunks/authThunks";
import { handleAsyncThunkCases } from "@/shared/utils/handleAsyncThunkCases";

export interface AuthState {
  loading: boolean; // TODO: replace with authInitializing
  error: string | null;
  isAuthenticated: boolean;
  authInitializing: boolean;
}

const initialState: AuthState = {
  loading: false,
  error: null,
  isAuthenticated: false,
  authInitializing: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setAuthInitializing: (state, action: PayloadAction<boolean>) => {
      state.authInitializing = action.payload;
    },
  },
  // extraReducers: (builder) => {
  //   handleAsyncThunkCases(builder, loginThunk);
  //   handleAsyncThunkCases(builder, logoutThunk);
  //   handleAsyncThunkCases(builder, signUpThunk);
  //   handleAsyncThunkCases(builder, checkAuthStatusThunk);
  // },
});

export const { setAuthenticated, setAuthInitializing } = authSlice.actions;
export default authSlice.reducer;
