import { useQuery } from "@tanstack/react-query";

import type { User } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import { userRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React Query hook for fetching candidate users for a specific project.
 *
 * @param projectId - Optional identifier of the project to fetch candidates for
 * @returns A React Query result object containing:
 *   - `data`: Array of User objects representing potential candidates for the project
 *   - `error`: Error object if the query fails
 *   - Other standard React Query properties (isLoading, isError, etc.)
 *
 * @example
 * ```typescript
 * const { data: candidates, isLoading, error } = useGetProjectCandidates(projectId);
 * ```
 */
export function useGetProjectCandidates(projectId?: ProjectId) {
  return useQuery<User[], Error>({
    queryKey: projectId
      ? QUERY_KEYS.project.candidates.byProject(projectId)
      : QUERY_KEYS.project.candidates.all,
    queryFn: async () => userRepository.findCandidatesForProject(projectId),
  });
}
