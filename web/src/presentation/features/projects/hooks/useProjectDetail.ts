import { useQuery } from "@tanstack/react-query";

import type { ProjectId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch and manage the details of a project by its ID.
 *
 * Utilizes React Query to handle data fetching, caching, and updating.
 * The query is enabled only when a valid `projectId` is provided.
 * Throws an error if `projectId` is undefined.
 *
 * @param projectId - The unique identifier of the project to fetch details for.
 * @returns The result of the React Query, including project data, loading, and error states.
 */
export function useProjectDetail(projectId: ProjectId) {
  const { getProjectDetail } = appContainer.usecases.project;

  return useQuery({
    queryKey: QUERY_KEYS.projectDetails(projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");
      return await getProjectDetail(projectId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
