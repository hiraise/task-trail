import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { isProtectedRoute } from "@/shared/utils/isProtectedRoute";
import { ROUTES } from "@/infrastructure/config/routes";
import { useCheckAuthStatus } from "./useCheckAuthStatus";
import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";

export function useInitSession(pathName: string) {
  const router = useRouter();
  const isProtected = isProtectedRoute(pathName);
  const isRootPage = pathName === ROUTES.main;

  const { isAuthenticated, authInitializing } = useCheckAuthStatus();
  useGetCurrentUser();

  useEffect(() => {
    if (!authInitializing) {
      // Handle root page redirection
      if (isRootPage) {
        if (isAuthenticated) {
          router.replace(ROUTES.projects);
        } else {
          router.replace(ROUTES.login);
        }
        return;
      }

      // Handle protected routes
      if (isProtected && !isAuthenticated) {
        toast.error("You need to log in to access this page.");
        router.replace(`${ROUTES.login}?from=${encodeURIComponent(pathName)}`);
      }
    }
  }, [isAuthenticated, pathName, isProtected, isRootPage, authInitializing, router]);
}
