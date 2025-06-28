"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { ROUTES } from "@/infrastructure/config/routes";
import { isProtectedRoute } from "@/shared/utils/isProtectedRoute";
import {
  setAuthenticated,
  setAuthInitializing,
} from "@/application/auth/slices/authSlice";
import { authService } from "@/infrastructure/api/authService";
import { userService } from "@/infrastructure/api/userService";
import {
  clearState,
  setCurrentUser,
} from "@/application/user/slices/userSlice";
import { toast } from "sonner";

export function AuthAndUserInitializer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathName = usePathname();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const authInitializing = useAppSelector(
    (state) => state.auth.authInitializing
  );
  const user = useAppSelector((state) => state.user.data);

  useEffect(() => {
    if (!isProtectedRoute(pathName) || isAuthenticated) return;

    dispatch(setAuthInitializing(true));

    (async () => {
      try {
        await authService.checkAuthStatus();
        if (!user) {
          const result = await userService.getCurrentUser();
          dispatch(setCurrentUser(result));
        }
        dispatch(setAuthenticated(true));
      } catch {
        dispatch(setAuthenticated(false));
        dispatch(clearState());
      } finally {
        dispatch(setAuthInitializing(false));
      }
    })();
    // eslint-disable-next-line
  }, [dispatch, pathName, isAuthenticated]);

  useEffect(() => {
    if (!authInitializing && !isAuthenticated && isProtectedRoute(pathName)) {
      toast.error("You need to log in to access this page.");
      router.replace(ROUTES.login);
    }
  }, [isAuthenticated, authInitializing, pathName, router]);

  return null;
}
