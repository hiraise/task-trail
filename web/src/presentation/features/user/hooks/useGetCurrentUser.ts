import { useQuery } from "@tanstack/react-query";

import type { CurrentUser } from "@/domain/models/User";
import { userRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

import { useCheckAuthStatus } from "../../auth/hooks";

/** Текущий пользователь; запрашивается, только когда вход подтверждён. */
export function useGetCurrentUser() {
  const { isAuthenticated, authInitializing } = useCheckAuthStatus();

  return useQuery<CurrentUser, Error>({
    queryKey: QUERY_KEYS.user.current,
    queryFn: () => userRepository.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!isAuthenticated && !authInitializing,
  });
}
