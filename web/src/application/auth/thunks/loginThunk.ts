import { createAsyncThunk } from "@reduxjs/toolkit";

import { AuthPayload } from "../types/types";
import { authService } from "@/infrastructure/api/auth";
import { AUTH_LOGIN } from "@/application/constants/actionTypes";
import { AppError, AppErrorProps } from "@/shared/errors/types";

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
    throw error;
  }
});
