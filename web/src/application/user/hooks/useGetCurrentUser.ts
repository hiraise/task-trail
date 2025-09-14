import { useQuery } from "@tanstack/react-query";

import { userService } from "@/infrastructure/api/userService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { useCheckAuthStatus } from "@/application/auth/hooks/useCheckAuthStatus";

export const useGetCurrentUser = () => {
  const { isAuthenticated, authInitializing } = useCheckAuthStatus();

  return useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: userService.getCurrentUser,
    enabled: !authInitializing && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
