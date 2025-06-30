import { createAsyncThunk } from "@reduxjs/toolkit";

import { authService } from "@/infrastructure/api/authService";
import { userService } from "@/infrastructure/api/userService";
import {
  setAuthenticated,
  setAuthInitializing,
} from "@/application/auth/slices/authSlice";
import {
  setCurrentUser,
  clearUserState,
} from "@/application/user/slices/userSlice";

export const initSessionThunk = createAsyncThunk(
  "auth/initSession",
  async (_, { dispatch }) => {
    dispatch(setAuthInitializing(true));
    try {
      await authService.checkAuthStatus();
      const user = await userService.getCurrentUser();
      dispatch(setCurrentUser(user));
      dispatch(setAuthenticated(true));
      return user;
    } catch (error) {
      dispatch(setAuthenticated(false));
      dispatch(clearUserState());
      throw error;
    } finally {
      dispatch(setAuthInitializing(false));
    }
  }
);
