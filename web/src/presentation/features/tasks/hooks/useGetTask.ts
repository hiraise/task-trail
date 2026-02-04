import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook for fetching a single task by its ID using React Query.
 *
 * @param taskId - The unique identifier of the task to fetch
 * @returns A React Query result object containing the task data, loading state, and error information
 *
 * @remarks
 * - Returns `null` if no taskId is provided
 * - Data is considered fresh for 5 minutes (staleTime)
 * - Cached data is kept for 10 minutes after becoming unused (gcTime)
 * - Automatically retries failed requests up to 2 times
 * - Query is disabled when taskId is falsy
 *
 * @example
 * ```tsx
 * const { data: task, isLoading, error } = useGetTask('task-123');
 * ```
 */
export function useGetTask(taskId: TaskId) {
  return useQuery<Task | null, Error>({
    queryKey: QUERY_KEYS.task(taskId),
    queryFn: async () => {
      if (!taskId) return null;

      return await taskRepository.findById(taskId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!taskId,
  });
}
