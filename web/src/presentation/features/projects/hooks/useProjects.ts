import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React hook to fetch and cache the list of projects.
 *
 * Utilizes React Query to manage the asynchronous fetching, caching,
 * and updating of project data from the backend via the project use case.
 *
 * @returns {UseQueryResult<ProjectResponseDto[], Error>} The query result object containing project data, loading, and error states.
 *
 * @example
 * const { data, isLoading, error } = useProjects();
 */
export function useProjects(): UseQueryResult<ProjectResponseDto[], Error> {
  const { getProjects } = appContainer.usecases.project;

  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: () => getProjects(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
