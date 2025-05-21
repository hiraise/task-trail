import { createAsyncThunk } from "@reduxjs/toolkit";

import { AuthPayload } from "../types/types";
import { authService } from "@/infrastructure/api/authService";
import { AUTH_SIGNUP } from "@/application/constants/actionTypes";
import { AppError, AppErrorProps } from "@/shared/errors/types";

export const signUpThunk = createAsyncThunk<
  void,
  AuthPayload,
  { rejectValue: AppErrorProps }
>(AUTH_SIGNUP, async (payload, { rejectWithValue }) => {
  try {
    await authService.signUp(payload);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return rejectWithValue(error.toPlain());
    }
    throw error;
  }
});
