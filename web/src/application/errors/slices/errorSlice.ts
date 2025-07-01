import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AppError } from "@/shared/errors/types";

interface ErrorState {
  error: AppError | null;
}

const initialState: ErrorState = {
  error: null,
};

const errorSlice = createSlice({
  name: "globalError",
  initialState,
  reducers: {
    addError: (state, action: PayloadAction<AppError>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { addError, clearError } = errorSlice.actions;
export default errorSlice.reducer;
