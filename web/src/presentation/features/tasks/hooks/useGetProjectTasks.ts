import { useQuery } from "@tanstack/react-query";

import type { Task } from "@/domain/models/Task";
import type { ProjectId } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to fetch tasks for a specific project.
 *
 * @param projectId - The unique identifier of the project to fetch tasks for
 * @returns A React Query result object containing:
 *   - `data`: Array of tasks for the project, or null if projectId is not provided
 *   - `error`: Error object if the query fails
 *   - Other standard React Query properties (isLoading, isError, etc.)
 *
 * @remarks
 * - The query is automatically enabled only when projectId is truthy
 * - Data is considered stale after 5 minutes
 * - Cache is garbage collected after 10 minutes of being unused
 * - Failed requests are retried up to 2 times
 * - Returns null if projectId is not provided
 *
 * @example
 * ```typescript
 * const { data: tasks, isLoading, error } = useGetProjectTasks('project-123');
 * ```
 */
export function useGetProjectTasks(projectId: ProjectId) {
  return useQuery<Task[] | null, Error>({
    queryKey: QUERY_KEYS.project.tasks(projectId),
    queryFn: async () => {
      if (!projectId) return null;

      return await taskRepository.findByProjectId(projectId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
