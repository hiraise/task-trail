import { createAsyncThunk } from "@reduxjs/toolkit";

import { Logout } from "@/domain/auth/types";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const createLogoutThunk = (logout: Logout) =>
  createAsyncThunk<void, void, { rejectValue: AppErrorProps }>(
    "auth/logout",
    async (_, { rejectWithValue }) => {
      try {
        await logout();
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return rejectWithValue(error.toPlain());
        }
        return rejectWithValue({
          type: AppErrorType.UNKNOWN,
          message: (error as Error).message,
        });
      }
    }
  );
