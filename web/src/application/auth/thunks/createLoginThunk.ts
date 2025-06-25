import { createAsyncThunk } from "@reduxjs/toolkit";

import { AuthPayload, Login } from "../../../domain/auth/types";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const createLoginThunk = (login: Login) =>
  createAsyncThunk<void, AuthPayload, { rejectValue: AppErrorProps }>(
    "auth/login",
    async (payload, { rejectWithValue }) => {
      try {
        await login(payload);
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
