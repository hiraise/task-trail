import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook that fetches all tasks for the current user using React Query.
 *
 * @remarks
 * This hook uses React Query's `useQuery` to manage server state with the following configuration:
 * - Cache key: Uses `QUERY_KEYS.userTasks` for cache identification
 * - Stale time: 5 minutes (data is considered fresh for this duration)
 * - Garbage collection time: 10 minutes (unused data is kept in cache for this duration)
 * - Retry: Attempts to refetch 2 times on failure
 *
 * @returns A React Query result object containing:
 * - `data`: Array of Task objects or null if no tasks exist
 * - `error`: Error object if the query fails
 * - `isLoading`, `isFetching`, `isError`, etc.: Standard React Query state flags
 *
 * @example
 * ```typescript
 * const { data: tasks, isLoading, error } = useGetUserTasks();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <TaskList tasks={tasks} />;
 * ```
 */
export function useGetUserTasks() {
  return useQuery<Task[] | null, Error>({
    queryKey: QUERY_KEYS.userTasks,
    queryFn: () => taskRepository.findAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
