import { createAsyncThunk } from "@reduxjs/toolkit";

import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";
import { ConfirmEmail } from "@/domain/auth/auth.contracts";

export const createConfirmEmailThunk = (confirmEmail: ConfirmEmail) =>
  createAsyncThunk<void, string, { rejectValue: AppErrorProps }>(
    "auth/confirmEmail",
    async (token, { rejectWithValue }) => {
      try {
        await confirmEmail(token);
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
