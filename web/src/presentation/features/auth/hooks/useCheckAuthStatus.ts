import { useQuery } from "@tanstack/react-query";

import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to check the current authentication status of the user.
 *
 * Utilizes a query to determine if the user is authenticated and whether the authentication check is still initializing.
 * The query does not retry on failure and does not refetch when the window regains focus.
 *
 * @returns An object containing:
 * - `isAuthenticated`: A boolean indicating if the user is authenticated.
 * - `authInitializing`: A boolean indicating if the authentication status is currently being loaded.
 */
export const useCheckAuthStatus = () => {
  const { checkAuthStatus } = appContainer.getUsecases().auth;

  const query = useQuery({
    queryKey: QUERY_KEYS.auth,
    queryFn: () => checkAuthStatus.execute(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    isAuthenticated: query.data?.isAuthenticated ?? false,
    authInitializing: query.isLoading,
  };
};
