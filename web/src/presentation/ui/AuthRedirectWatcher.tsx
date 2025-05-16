"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { RootState } from "@/infrastructure/redux/store";
import { ROUTES } from "@/infrastructure/config/routes";
import { clearError, resetRedirect } from "@/application/auth/slices/authSlice";

export const AuthRedirectWatcher = () => {
  const shouldRedirect = useSelector(
    (state: RootState) => state.auth.shouldRedirectToLogin
  );
  const error = useSelector((state: RootState) => state.auth.error);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (shouldRedirect) {
      router.push(ROUTES.login);
      dispatch(resetRedirect());
    }
  }, [dispatch, router, shouldRedirect]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [dispatch, error]);

  return null;
};
