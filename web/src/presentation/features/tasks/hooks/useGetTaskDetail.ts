import { useQuery } from "@tanstack/react-query";

import { getTaskDetailUseCase } from "@/application/usecases";
import type { TaskId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to fetch task details by task ID.
 *
 * @param taskId - The unique identifier of the task to retrieve, or undefined if no task is selected.
 * @returns A UseQueryResult containing the task details, null, or an error.
 *
 * @remarks
 * The query is only enabled when a valid taskId is provided.
 * If taskId is undefined or falsy, the query will not execute.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGetTaskDetail(taskId);
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 * if (data) return <TaskDetail task={data} />;
 * ```
 */
export function useGetTaskDetail(taskId: TaskId | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.taskDetails(taskId || ""),
    queryFn: async () => {
      if (!taskId) throw new Error("Task ID is required");

      return await getTaskDetailUseCase(taskId);
    },
    enabled: !!taskId,
  });
}
