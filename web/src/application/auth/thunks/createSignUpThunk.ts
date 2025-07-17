import { createAsyncThunk } from "@reduxjs/toolkit";

import { SignUp } from "../../../domain/auth/auth.contracts";
import { AuthPayload } from "@/domain/auth/auth.payload";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const createSignUpThunk = (signUp: SignUp) =>
  createAsyncThunk<void, AuthPayload, { rejectValue: AppErrorProps }>(
    "auth/signUp",
    async (payload, { rejectWithValue }) => {
      try {
        await signUp(payload);
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
