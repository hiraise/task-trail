import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { useGetUserTasks } from "@/presentation/features/tasks/hooks";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

interface UseGetTaskListDetailsResult {
  data: TaskDetailResponseDto[];
  isLoading: boolean;
  isError: boolean;
}

/**
 * Custom React hook to fetch detailed information for all current user's tasks.
 *
 * This hook first fetches the user's tasks, then fetches detailed information
 * for each task using parallel queries.
 *
 * @returns {UseGetTaskListDetailsResult} Object containing:
 *   - data: Array of task details
 *   - isLoading: True if any queries are loading or user tasks are loading
 *   - isError: True if any queries have errors
 *
 * @example
 * const { data: taskDetails, isLoading, isError } = useGetTaskListDetails();
 */
export function useGetTaskListDetails(): UseGetTaskListDetailsResult {
  const { data: tasks, isLoading: isLoadingTasks } = useGetUserTasks();

  const taskIds = useMemo(() => [...new Set(tasks?.map((task) => task.id))], [tasks]);
  const { getTaskDetail } = appContainer.getUsecases().tasks;

  const results = useQueries({
    queries: taskIds.map((taskId) => ({
      queryKey: QUERY_KEYS.taskDetails(taskId),
      queryFn: async () => getTaskDetail.execute(taskId),
      enabled: !!taskId && !isLoadingTasks,
    })),
    combine: (queries) => {
      return {
        data: queries.map((q) => q.data).filter((d): d is TaskDetailResponseDto => !!d),
        isLoading: queries.some((q) => q.isLoading),
        isError: queries.some((q) => q.isError),
      };
    },
  });

  return results;
}
