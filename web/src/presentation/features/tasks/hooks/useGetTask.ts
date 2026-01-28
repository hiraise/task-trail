import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useGetTask(
  taskId: string | number | null | undefined,
): UseQueryResult<TaskResponseDto | null, Error> {
  const { getTask } = appContainer.usecases.tasks;

  return useQuery({
    queryKey: QUERY_KEYS.task(Number(taskId)),
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
