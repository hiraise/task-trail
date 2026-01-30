import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch and manage the list of project members for a given project.
 *
 * Utilizes React Query to handle data fetching, caching, and background updates.
 * The hook is enabled only when a valid `projectId` is provided.
 *
 * @param projectId - The unique identifier of the project whose members are to be fetched.
 * @returns A React Query result object containing the list of project members, loading state, error information, and query utilities.
 *
 * @example
 * const { data, isLoading, error } = useProjectMembers(123);
 */
export function useProjectMembers(projectId: ProjectId): UseQueryResult<ProjectMember[], Error> {
  const { findByProjectId } = appContainer.repositories.projectMember;

  return useQuery({
    queryKey: QUERY_KEYS.projectMembers(projectId || ""),
    queryFn: () => findByProjectId(projectId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
