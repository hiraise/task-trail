import { createAsyncThunk } from "@reduxjs/toolkit";

import { UpdateUser } from "@/domain/user/user.contracts";
import { User } from "@/domain/user/user.entity";
import { AppError, AppErrorProps, AppErrorType } from "@/shared/errors/types";

export const createUpdateUserThunk = (updateUser: UpdateUser) =>
  createAsyncThunk<User | null, Partial<User>, { rejectValue: AppErrorProps }>(
    "user/updateUser",
    async (user, { rejectWithValue }) => {
      try {
        return await updateUser(user);
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
