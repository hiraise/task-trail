import { createAsyncThunk } from "@reduxjs/toolkit";

import { LoginPayload, LoginResponse } from "../types/types";
import { authService } from "@/infrastructure/api/auth";
import { AUTH_LOGIN } from "@/application/constants/actionTypes";

export const loginThunk = createAsyncThunk<LoginResponse, LoginPayload>(
  AUTH_LOGIN,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);
      localStorage.setItem("token", response.token);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Ошибка входа"
      );
    }
  }
);
