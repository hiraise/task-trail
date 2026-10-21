import { useQuery } from "@tanstack/react-query";

import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to fetch and manage the details of a specific project.
 *
 * @param projectId - The unique identifier of the project to fetch. If not provided, the query will be disabled.
 * @returns A `useQuery` result object containing the project details or `null` if no `projectId` is provided.
 *
 * @remarks
 * - The query will be retried up to 2 times in case of failure.
 * - The data is considered fresh for 5 minutes (`staleTime`).
 * - The data will be garbage collected after 10 minutes of inactivity (`gcTime`).
 * - The query is only enabled when a valid `projectId` is provided.
 *
 * @example
 * ```typescript
 * const { data: project, isLoading, error } = useProject("123");
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * return <div>Project Name: {project?.name}</div>;
 * ```
 */
export function useProject(projectId?: ProjectId) {
  return useQuery<ProjectDetails | null, Error>({
    queryKey: QUERY_KEYS.project.detail(projectId || ""),
    queryFn: async () => {
      if (!projectId) return null;

      return await projectRepository.findById(projectId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
