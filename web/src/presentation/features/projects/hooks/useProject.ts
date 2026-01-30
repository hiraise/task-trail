import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch and cache a single project by its ID using React Query.
 *
 * @param projectId - The unique identifier of the project to fetch. Can be a ProjectId or undefined.
 * @returns The result of the query, including the project data (`ProjectDetails | null`), loading and error states.
 *
 * @remarks
 * - The query is enabled only if `projectId` is truthy.
 * - Data is considered fresh for 5 minutes (`staleTime`).
 * - Cached data is garbage collected after 10 minutes (`gcTime`).
 * - The query will retry up to 2 times on failure.
 * - If `projectId` is not provided, the query returns `null`.
 */
export function useProject(projectId?: ProjectId): UseQueryResult<ProjectDetails | null, Error> {
  const { getProject } = appContainer.usecases.project;

  return useQuery({
    queryKey: QUERY_KEYS.project(projectId || ""),
    queryFn: async () => {
      if (!projectId) return null;
      return await getProject(projectId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
