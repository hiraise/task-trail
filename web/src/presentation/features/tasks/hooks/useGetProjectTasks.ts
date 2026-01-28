import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch tasks for a specific project using React Query.
 *
 * @param projectId - The unique identifier of the project whose tasks are to be fetched.
 * @returns A React Query result object containing an array of `TaskResponseDto` or `null` if no projectId is provided, along with query status and error information.
 *
 * @remarks
 * - The query is enabled only if a valid `projectId` is provided.
 * - Data is considered fresh for 5 minutes (`staleTime`).
 * - Unused data is garbage collected after 10 minutes (`gcTime`).
 * - The query will retry up to 2 times on failure.
 */
export function useGetProjectTasks(
  projectId: string | number,
): UseQueryResult<TaskResponseDto[] | null, Error> {
  const { getProjectTasks } = appContainer.usecases.tasks;

  return useQuery({
    queryKey: QUERY_KEYS.projectTasks(Number(projectId)),
    queryFn: async () => {
      if (!projectId) return null;
      return await getProjectTasks(projectId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
