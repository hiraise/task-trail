import { configureStore } from "@reduxjs/toolkit";

import { errorHandlingMiddleware } from "./middleware";
import authReducer from "@/application/auth/slices/authSlice";
import userReducer from "@/application/user/slices/userSlice";
import errorSlice from "@/application/errors/slices/errorSlice";
import { authApi } from "../adapters/authApi";

export const store = configureStore({
  devTools: process.env.NODE_ENV === "development",
  reducer: {
    auth: authReducer,
    user: userReducer,
    globalError: errorSlice,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(errorHandlingMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
