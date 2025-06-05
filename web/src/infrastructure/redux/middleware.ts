/* eslint-disable @typescript-eslint/no-explicit-any */

import { isRejectedWithValue } from "@reduxjs/toolkit";

import { AppError, AppErrorType } from "@/shared/errors/types";
import { GLOBAL_ERRORS } from "@/shared/errors/globalErrors";
import {
  requireAuthRedirect,
  setError,
} from "@/application/auth/slices/authSlice";

export const errorHandlingMiddleware =
  (storeAPI: any) => (next: any) => (action: any) => {
    if (isRejectedWithValue(action)) {
      const error = action.payload as AppError;

      // Skip handling if error is not an AppError or not a global error
      if (!error?.type || !GLOBAL_ERRORS.includes(error.type)) {
        return next(action);
      }

      // TODO: move error message to locale
      switch (error.type) {
        case AppErrorType.UNAUTHORIZED:
          storeAPI.dispatch(requireAuthRedirect());
          break;
        case AppErrorType.NETWORK:
          storeAPI.dispatch(
            setError("Network error. Please check your connection.")
          );
          break;
        case AppErrorType.UNKNOWN:
          storeAPI.dispatch(
            setError(error.message || "An unknown error occurred.")
          );
          break;
      }
    }

    return next(action);
  };
