import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { User } from "@/domain/user/user.entity";
import { getCurrentUserThunk, updateUserThunk } from "../thunks/userThunks";

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
    clearUserState() {
      return initialState;
    },
    updateAvatar(state, action: PayloadAction<string>) {
      if (!state.data) return;
      state.data.avatarUrl = action.payload;
    },
    setCurrentUser(state, action: PayloadAction<User | null>) {
      state.data = action.payload;
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
    // Update User
    builder.addCase(updateUserThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    });
    builder.addCase(updateUserThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to update user";
    });
  },
});

export const { clearUserState, updateAvatar, setCurrentUser } = userSlice.actions;
export default userSlice.reducer;
