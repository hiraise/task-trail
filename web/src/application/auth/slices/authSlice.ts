import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  isAuthenticated: boolean;
  authInitializing: boolean;
}

const initialState: AuthState = {
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
});

export const { setAuthenticated, setAuthInitializing } = authSlice.actions;
export default authSlice.reducer;
