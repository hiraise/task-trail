import { configureStore } from "@reduxjs/toolkit";

import { errorHandlingMiddleware } from "./middleware";
import authReducer from "@/application/auth/slices/authSlice";
import userReducer from "@/application/user/slices/userSlice";
import projectsReducer from "@/application/projects/slices/projectsSlice";
import projectReducer from "@/application/projects/slices/projectSlice";
import errorSlice from "@/application/errors/slices/errorSlice";
import { authApi } from "../adapters/authApi";
import projectsApi from "../adapters/projectsApi";
import taskReducer from "@/application/tasks/slices/taskSlice";

export const store = configureStore({
  devTools: process.env.NODE_ENV === "development",
  reducer: {
    auth: authReducer,
    user: userReducer,
    project: projectReducer,
    projects: projectsReducer,
    task: taskReducer,
    globalError: errorSlice,
    [authApi.reducerPath]: authApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(projectsApi.middleware)
      .concat(errorHandlingMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
