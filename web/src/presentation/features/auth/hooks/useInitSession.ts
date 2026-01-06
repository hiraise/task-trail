"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { useCheckAuthStatus } from "@/presentation/features/auth/hooks";
import { ROUTES } from "@/shared/config/routes";
import { isProtectedRoute } from "@/shared/utils/isProtectedRoute";

/**
 * Initializes the user session and handles route redirection based on authentication status.
 *
 * - If the current route is the root page, redirects authenticated users to the projects page,
 *   and unauthenticated users to the login page.
 * - If the current route is protected and the user is not authenticated, displays an error toast
 *   and redirects to the login page, preserving the original path for post-login redirection.
 *
 * @param pathName - The current route path to check for authentication and redirection logic.
 */
export function useInitSession(pathName: string) {
  const router = useRouter();
  const isProtected = isProtectedRoute(pathName);
  const isRootPage = pathName === ROUTES.main;

  const { isAuthenticated, authInitializing } = useCheckAuthStatus();

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
