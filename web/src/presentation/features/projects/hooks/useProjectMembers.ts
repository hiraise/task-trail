import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { ProjectMemberResponseDto } from "@/application/dto/ProjectMemberResponseDto";
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
export function useProjectMembers(
  projectId: string | number,
): UseQueryResult<ProjectMemberResponseDto[], Error> {
  const { getProjectMembers } = appContainer.usecases.projectMember;

  return useQuery({
    queryKey: QUERY_KEYS.projectMembers(Number(projectId) || -1),
    queryFn: () => getProjectMembers(projectId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
