import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { User } from "@/domain/models/User";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

import { useCheckAuthStatus } from "../../auth/hooks";

/**
 * Custom React hook to fetch the current authenticated user's data.
 *
 * Utilizes React Query to manage the asynchronous request and caching.
 * The query is enabled only when authentication has been initialized and the user is authenticated.
 *
 * @returns {UseQueryResult<User | null, Error>} The result of the query containing user data or an error.
 */
export function useGetCurrentUser(): UseQueryResult<User | null, Error> {
  const { isAuthenticated, authInitializing } = useCheckAuthStatus();
  const { getCurrentUser } = appContainer.usecases.user;

  return useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!isAuthenticated && !authInitializing,
  });
}
