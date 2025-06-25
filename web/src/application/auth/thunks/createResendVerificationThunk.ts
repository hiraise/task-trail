import { createAsyncThunk } from "@reduxjs/toolkit";

import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";
import { ResendVerification } from "@/domain/auth/types";

export const createResendVerificationThunk = (
  resendVerification: ResendVerification
) =>
  createAsyncThunk<void, string, { rejectValue: AppErrorProps }>(
    "auth/resendVerification",
    async (email, { rejectWithValue }) => {
      try {
        await resendVerification(email);
      } catch (error) {
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
