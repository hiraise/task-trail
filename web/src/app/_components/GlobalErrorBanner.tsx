"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { clearError } from "@/application/errrors/slices/errorSlice";

export function GlobalErrorBanner() {
  const error = useAppSelector((state) => state.globalError.error);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (error) {
      toast.error(error.message);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return null;
}
