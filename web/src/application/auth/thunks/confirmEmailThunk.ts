import { createAsyncThunk } from "@reduxjs/toolkit";

import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";
import { authService } from "@/infrastructure/api/authService";

export const confirmEmailThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: AppErrorProps }
>("auth/confirmEmail", async (token, { rejectWithValue }) => {
  try {
    await authService.verifyEmail(token);
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
