import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useGetTask(taskId: TaskId): UseQueryResult<Task | null, Error> {
  const { getTask } = appContainer.usecases.tasks;

  return useQuery({
    queryKey: QUERY_KEYS.task(taskId),
    queryFn: async () => {
      if (!taskId) return null;

      return await getTask(taskId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!taskId,
  });
}
