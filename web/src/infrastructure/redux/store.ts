import { configureStore } from "@reduxjs/toolkit";

import authReducer from "@/application/auth/slices/authSlice";
import userReducer from "@/application/user/slices/userSlice";
import { errorHandlingMiddleware } from "./middleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(errorHandlingMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
