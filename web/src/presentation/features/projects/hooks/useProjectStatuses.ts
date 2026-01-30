import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { TaskStatus } from "@/domain/models/TaskStatus";
import type { ProjectId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch the list of task statuses for a specific project.
 *
 * Utilizes React Query to manage the fetching, caching, and updating of project statuses.
 * The query is enabled only if a valid `projectId` is provided.
 *
 * @param projectId - The unique identifier of the project for which to fetch task statuses.
 * @returns A React Query result object containing an array of `TaskStatus` or an error.
 *
 * @example
 * const { data, isLoading, error } = useProjectStatuses(123);
 */
export function useProjectStatuses(projectId: ProjectId): UseQueryResult<TaskStatus[], Error> {
  const { getProjectStatuses } = appContainer.usecases.project;

  return useQuery({
    queryKey: QUERY_KEYS.projectStatuses(projectId),
    queryFn: () => getProjectStatuses(projectId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
