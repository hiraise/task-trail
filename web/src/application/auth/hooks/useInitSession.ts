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

  const { isAuthenticated, authInitializing } = useCheckAuthStatus();
  useGetCurrentUser();

  useEffect(() => {
    if (isProtected && !authInitializing && !isAuthenticated) {
      toast.error("You need to log in to access this page.");
      router.replace(`${ROUTES.login}?from=${encodeURIComponent(pathName)}`);
    }
  }, [isAuthenticated, pathName, isProtected, authInitializing, router]);
}
