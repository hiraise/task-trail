import { useQuery } from "@tanstack/react-query";

import type { TaskStatus } from "@/domain/models/TaskStatus";
import type { ProjectId } from "@/domain/types";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to fetch and manage the statuses of tasks within a specific project.
 *
 * @param projectId - The unique identifier of the project for which to fetch task statuses.
 * @returns A `useQuery` result containing an array of task statuses or an error.
 *
 * @remarks
 * - The query is identified by a unique key generated using the project ID.
 * - The query function fetches the project statuses from the `projectRepository`.
 * - The data is considered fresh for 5 minutes (`staleTime`).
 * - Garbage collection for unused query data occurs after 10 minutes (`gcTime`).
 * - The query will retry up to 2 times in case of failure.
 * - The query is enabled only if a valid `projectId` is provided.
 *
 * @see QUERY_KEYS.project.statuses
 * @see projectRepository.getProjectStatuses
 */
export function useProjectStatuses(projectId: ProjectId) {
  return useQuery<TaskStatus[], Error>({
    queryKey: QUERY_KEYS.project.statuses(projectId),
    queryFn: () => projectRepository.getProjectStatuses(projectId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
