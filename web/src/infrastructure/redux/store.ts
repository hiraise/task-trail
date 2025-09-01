import { configureStore } from "@reduxjs/toolkit";

import { errorHandlingMiddleware } from "./middleware";
import errorSlice from "@/application/errors/slices/errorSlice";

//TODO: replace reducers with React Query

export const store = configureStore({
  devTools: process.env.NODE_ENV === "development",
  reducer: {
    globalError: errorSlice,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(errorHandlingMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
