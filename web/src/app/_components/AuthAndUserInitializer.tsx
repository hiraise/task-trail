"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { isProtectedRoute } from "@/shared/utils/isProtectedRoute";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { ROUTES } from "@/infrastructure/config/routes";
import { initSessionThunk } from "@/application/auth/thunks/initSessionThunk";

export function AuthAndUserInitializer() {
  const pathName = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const isProtected = isProtectedRoute(pathName);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const authInitializing = useAppSelector((s) => s.auth.authInitializing);

  useEffect(() => {
    if (isProtected && !isAuthenticated) dispatch(initSessionThunk());
  }, [isProtected, isAuthenticated, dispatch]);

  useEffect(() => {
    if (isProtected && !authInitializing && !isAuthenticated) {
      toast.error("You need to log in to access this page.");
      router.replace(`${ROUTES.login}?from=${encodeURIComponent(pathName)}`);
    }
  }, [isAuthenticated, pathName, isProtected, authInitializing, router]);

  return null;
}
