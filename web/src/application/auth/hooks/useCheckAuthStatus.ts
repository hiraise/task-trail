import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { authService } from "@/infrastructure/api/authService";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const useCheckAuthStatus = () => {
  const query = useQuery({
    queryKey: QUERY_KEYS.auth,
    queryFn: async () => {
      try {
        await authService.checkAuthStatus();
        return true;
      } catch (error) {
        clientLogger.error("Failed to check auth state", { error });
        return false;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    isAuthenticated: !!query.data,
    authInitializing: query.isLoading,
  };
};
