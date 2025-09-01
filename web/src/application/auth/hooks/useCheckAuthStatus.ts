import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { authService } from "@/infrastructure/api/authService";

export const useCheckAuthStatus = () => {
  const query = useQuery({
    queryKey: QUERY_KEYS.auth,
    queryFn: async () => {
      await authService.checkAuthStatus();
      return true;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    isAuthenticated: !!query.data,
    authInitializing: query.isLoading,
  };
};
