import { createAsyncThunk } from "@reduxjs/toolkit";

import { CheckAuthStatus } from "../../../domain/auth/auth.contracts";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const createCheckAuthStatusThunk = (checkAuthStatus: CheckAuthStatus) =>
  createAsyncThunk<void, void, { rejectValue: AppErrorProps }>(
    "auth/checkAuthStatus",
    async (_, { rejectWithValue }) => {
      try {
        await checkAuthStatus();
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
