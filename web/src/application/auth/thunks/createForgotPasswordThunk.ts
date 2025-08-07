import { createAsyncThunk } from "@reduxjs/toolkit";

import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";
import { ForgotPassword } from "@/domain/auth/auth.contracts";

export const createForgotPasswordThunk = (forgotPassword: ForgotPassword) =>
  createAsyncThunk<void, string, { rejectValue: AppErrorProps }>(
    "auth/forgotPassword",
    async (email, { rejectWithValue }) => {
      try {
        await forgotPassword(email);
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
