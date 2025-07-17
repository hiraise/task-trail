import { createAsyncThunk } from "@reduxjs/toolkit";

import { GetCurrentUser } from "@/domain/user/user.contracts";
import { User } from "@/domain/user/user.entity";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const createGetCurrentUserThunk = (getCurrentUser: GetCurrentUser) =>
  createAsyncThunk<User | null, void, { rejectValue: AppErrorProps }>(
    "user/getCurrentUser",
    async (_, { rejectWithValue }) => {
      try {
        return await getCurrentUser();
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
