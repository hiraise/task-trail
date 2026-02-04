import { useQuery } from "@tanstack/react-query";

import type { AuthStatusDto } from "@/application/dto/AuthStatusDto";
import { checkAuthStatusUseCase } from "@/application/usecases";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to check the authentication status of the user.
 *
 * This hook uses a query to fetch the authentication status and provides
 * the result in the form of an `AuthStatusDto` object. It also manages
 * the loading state during the query execution.
 *
 * @returns {AuthStatusDto} An object containing:
 * - `isAuthenticated`: A boolean indicating whether the user is authenticated.
 * - `authInitializing`: A boolean indicating whether the authentication status is being loaded.
 */
export const useCheckAuthStatus = (): AuthStatusDto => {
  const query = useQuery({
    queryKey: QUERY_KEYS.auth,
    queryFn: () => checkAuthStatusUseCase(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    isAuthenticated: query.data?.isAuthenticated ?? false,
    authInitializing: query.isLoading,
  };
};
