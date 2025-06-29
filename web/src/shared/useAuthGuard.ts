import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch } from "@/infrastructure/redux/hooks";
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
import { ROUTES } from "@/infrastructure/config/routes";

export function useAuthGuard() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    dispatch(setAuthInitializing(true));

    try {
      await authService.checkAuthStatus();
      const result = await userService.getCurrentUser();
      dispatch(setCurrentUser(result));
      dispatch(setAuthenticated(true));
    } catch {
      // Error handler via redux middleware
      dispatch(setAuthenticated(false));
      dispatch(clearState());
    } finally {
      dispatch(setAuthInitializing(false));
    }
  }, [dispatch]);

  const redirectToLogin = useCallback(
    (currentPath: string) => {
      toast.error("You need to log in to access this page.");
      router.replace(`${ROUTES.login}?from=${encodeURIComponent(currentPath)}`);
    },
    [router]
  );

  return { checkAuth, redirectToLogin };
}
