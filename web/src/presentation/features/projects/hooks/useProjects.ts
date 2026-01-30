import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { Project } from "@/domain/models/Project";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * React hook for fetching the list of projects.
 *
 * Uses the project repository to retrieve all projects and caches the result
 * with React Query. Results are considered fresh for 5 minutes, garbage
 * collected after 10 minutes, and failed requests are retried up to 2 times.
 *
 * @returns A React Query result containing the project list or an error.
 */
export function useProjects(): UseQueryResult<Project[], Error> {
  const { findAll } = appContainer.repositories.project;

  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: () => findAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
