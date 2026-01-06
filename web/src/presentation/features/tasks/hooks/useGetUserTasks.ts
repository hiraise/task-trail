import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch the current user's tasks using React Query.
 *
 * @returns {UseQueryResult<TaskResponseDto[] | null, Error>} The result object containing the user's tasks,
 * loading state, error information, and query utilities.
 *
 * @remarks
 * - Uses a stale time of 5 minutes and a garbage collection time of 10 minutes.
 * - Retries the query up to 2 times on failure.
 * - The query key is defined by `QUERY_KEYS.userTasks`.
 *
 * @example
 * const { data, isLoading, error } = useGetUserTasks();
 */
export function useGetUserTasks(): UseQueryResult<TaskResponseDto[] | null, Error> {
  const { getCurrentUserTasks } = appContainer.getUsecases().tasks;

  return useQuery({
    queryKey: QUERY_KEYS.userTasks,
    queryFn: () => getCurrentUserTasks.execute(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
