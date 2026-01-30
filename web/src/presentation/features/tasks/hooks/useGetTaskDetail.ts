import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import type { TaskId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch detailed information about a specific task.
 *
 * Utilizes React Query's `useQuery` to manage the fetching, caching, and updating of task details.
 * The query is enabled only if a valid `taskId` is provided.
 *
 * @param taskId - The unique identifier of the task to fetch details for. If undefined, the query is disabled.
 * @returns A `UseQueryResult` containing the task detail response or `null`, and any potential error.
 *
 * @throws Error if `taskId` is not provided when the query function is executed.
 *
 * @example
 * const { data, error, isLoading } = useGetTaskDetail(123);
 */
export function useGetTaskDetail(
  taskId: TaskId | undefined,
): UseQueryResult<TaskDetailResponseDto | null, Error> {
  const { getTaskDetail } = appContainer.usecases.tasks;

  return useQuery({
    queryKey: QUERY_KEYS.taskDetails(taskId || ""),
    queryFn: async () => {
      if (!taskId) throw new Error("Task ID is required");
      return await getTaskDetail(taskId);
    },
    enabled: !!taskId,
  });
}
