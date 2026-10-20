import { useQuery } from "@tanstack/react-query";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to fetch and manage project members data using React Query.
 *
 * @param projectId - The unique identifier of the project to fetch members for
 * @returns A React Query result object containing:
 *   - `data`: Array of ProjectMember objects if the query succeeds
 *   - `error`: Error object if the query fails
 *   - Additional React Query properties (isLoading, isFetching, etc.)
 *
 * @remarks
 * - The query is only enabled when a valid projectId is provided
 * - Data is considered fresh for 5 minutes (staleTime)
 * - Cached data is garbage collected after 10 minutes of inactivity (gcTime)
 * - Failed requests are retried up to 2 times
 *
 * @example
 * ```typescript
 * const { data: members, isLoading, error } = useProjectMembers('project-123');
 * ```
 */
export function useProjectMembers(projectId: ProjectId) {
  return useQuery<ProjectMember[], Error>({
    queryKey: QUERY_KEYS.project.members(projectId || ""),
    queryFn: () => projectMemberRepository.findByProjectId(projectId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
