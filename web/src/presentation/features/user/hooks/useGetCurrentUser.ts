import { useQuery } from "@tanstack/react-query";

import type { User } from "@/domain/models/User";
import { userRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

import { useCheckAuthStatus } from "../../auth/hooks";

/**
 * Custom hook to fetch the current user data.
 *
 * This hook utilizes the `useQuery` hook from React Query to fetch and cache
 * the current user's information. It depends on the authentication status
 * and initialization state to determine whether the query should be enabled.
 *
 * @returns {UseQueryResult<User | null, Error>} The query result containing the current user data or null if not authenticated.
 *
 * @remarks
 * - The query is identified by the `QUERY_KEYS.currentUser` key.
 * - The query function fetches the current user using the `getCurrentUser` method from the `userRepository`.
 * - The query result is considered stale after 5 minutes (`staleTime`).
 * - Garbage collection for the query result occurs after 10 minutes (`gcTime`).
 * - The query will retry up to 2 times in case of failure.
 * - The query is enabled only when the user is authenticated (`isAuthenticated`) and the authentication process is not initializing (`authInitializing`).
 *
 * @see useCheckAuthStatus
 * @see userRepository.getCurrentUser
 */
export function useGetCurrentUser() {
  const { isAuthenticated, authInitializing } = useCheckAuthStatus();
  const { getCurrentUser } = userRepository;

  return useQuery<User | null, Error>({
    queryKey: QUERY_KEYS.user.current,
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!isAuthenticated && !authInitializing,
  });
}
