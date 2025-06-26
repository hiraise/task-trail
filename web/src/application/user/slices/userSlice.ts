import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { User } from "@/domain/user/types";
import { getCurrentUserThunk } from "../thunks/getCurrentUserThunk";

type UserState = {
  data: User | null;
  loading: boolean;
  error: string | null;
};

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearState() {
      return initialState;
    },
    updateAvatar(state, action: PayloadAction<string>) {
      if (!state.data) return;
      state.data.avatarUrl = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Get Current User
    builder.addCase(getCurrentUserThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getCurrentUserThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    });
    builder.addCase(getCurrentUserThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to get current user";
    });
  },
});

export const { clearState, updateAvatar } = userSlice.actions;
export default userSlice.reducer;
