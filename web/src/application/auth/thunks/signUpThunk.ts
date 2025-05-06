import { createAsyncThunk } from "@reduxjs/toolkit";

import { LoginPayload, LoginResponse } from "../types/types";
import { authService } from "@/infrastructure/api/auth";
import { AUTH_SIGNUP } from "@/application/constants/actionTypes";

export const signUpThunk = createAsyncThunk<LoginResponse, LoginPayload>(
  AUTH_SIGNUP,
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.signUp(payload);
      localStorage.setItem("token", response.token);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Ошибка регистрации"
      );
    }
  }
);
