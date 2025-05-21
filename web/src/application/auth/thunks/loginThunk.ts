import { createAsyncThunk } from "@reduxjs/toolkit";

import { AuthPayload } from "../types/types";
import { authService } from "@/infrastructure/api/authService";
import { AUTH_LOGIN } from "@/application/constants/actionTypes";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const loginThunk = createAsyncThunk<
  void,
  AuthPayload,
  { rejectValue: AppErrorProps }
>(AUTH_LOGIN, async (payload, { rejectWithValue }) => {
  try {
    await authService.login(payload);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return rejectWithValue(error.toPlain());
    }
    return rejectWithValue({
      type: AppErrorType.UNKNOWN,
      message: (error as Error).message,
    });
  }
});
