import { createAsyncThunk } from "@reduxjs/toolkit";

import { Logout } from "@/domain/auth/types";
import { AppErrorProps } from "@/shared/errors/types";
import { setAuthenticated, setAuthInitializing } from "../slices/authSlice";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { clearUserState } from "@/application/user/slices/userSlice";

export const createLogoutThunk = (logout: Logout) =>
  createAsyncThunk<void, void, { rejectValue: AppErrorProps }>(
    "auth/logout",
    async (_, { dispatch, rejectWithValue }) => {
      dispatch(setAuthInitializing(true));
      try {
        await logout();
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      } finally {
        dispatch(setAuthenticated(false));
        dispatch(clearUserState());
        dispatch(setAuthInitializing(false));
      }
    }
  );
