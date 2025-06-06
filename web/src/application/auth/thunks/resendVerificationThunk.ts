import { createAsyncThunk } from "@reduxjs/toolkit";

import { authService } from "@/infrastructure/api/authService";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const resendVerificationThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: AppErrorProps }
>("auth/resendVerification", async (email, { rejectWithValue }) => {
  try {
    await authService.resendVerification(email);
  } catch (error) {
    if (error instanceof AppError) {
      return rejectWithValue(error.toPlain());
    }
    return rejectWithValue({
      type: AppErrorType.UNKNOWN,
      message: (error as Error).message,
    });
  }
});
