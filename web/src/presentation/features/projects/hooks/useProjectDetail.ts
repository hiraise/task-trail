import { useQuery } from "@tanstack/react-query";

import { getProjectDetailUseCase } from "@/application/usecases";
import type { ProjectId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * A custom hook that fetches and manages the details of a specific project.
 *
 * @param projectId - The unique identifier of the project to fetch details for.
 *
 * @returns The result of the `useQuery` hook, which includes the project details,
 *          loading state, error state, and other query-related information.
 *
 * @throws {Error} If the `projectId` is not provided.
 *
 * @remarks
 * - The query is enabled only when a valid `projectId` is provided.
 * - The query result is considered fresh for 5 minutes (`staleTime`).
 * - The query result is garbage collected after 10 minutes (`gcTime`).
 * - The query will retry up to 2 times in case of failure.
 */
export function useProjectDetail(projectId: ProjectId) {
  return useQuery({
    queryKey: QUERY_KEYS.projectDetails(projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");

      return await getProjectDetailUseCase(projectId);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!projectId,
  });
}
