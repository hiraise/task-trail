/* eslint-disable @typescript-eslint/no-explicit-any */
import { isRejectedWithValue } from "@reduxjs/toolkit";

import { AppError, AppErrorType } from "@/shared/errors/types";
import {
  requireAuthRedirect,
  setError,
} from "@/application/auth/slices/authSlice";

export const errorHandlingMiddleware =
  (storeAPI: any) => (next: any) => (action: any) => {
    if (isRejectedWithValue(action)) {
      const error = action.payload as AppError;

      switch (error.type) {
        case AppErrorType.UNAUTHORIZED:
          storeAPI.dispatch(requireAuthRedirect());
          break;
        default:
          storeAPI.dispatch(setError(error.message));
      }
    }

    return next(action);
  };
