"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { isProtectedRoute } from "@/shared/utils/isProtectedRoute";
import { useAuthGuard } from "@/shared/useAuthGuard";
import { useAppSelector } from "@/infrastructure/redux/hooks";

export function AuthAndUserInitializer() {
  const pathName = usePathname();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authInitializing = useAppSelector(
    (state) => state.auth.authInitializing
  );
  const { checkAuth, redirectToLogin } = useAuthGuard();

  useEffect(() => {
    if (!isProtectedRoute(pathName) || isAuthenticated) return;
    checkAuth();
  }, [checkAuth, isAuthenticated, pathName]);

  useEffect(() => {
    if (!authInitializing && !isAuthenticated && isProtectedRoute(pathName)) {
      redirectToLogin(pathName);
    }
  }, [authInitializing, isAuthenticated, pathName, redirectToLogin]);

  return null;
}
