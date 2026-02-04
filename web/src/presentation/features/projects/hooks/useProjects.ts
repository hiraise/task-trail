import { useQuery } from "@tanstack/react-query";

import type { Project } from "@/domain/models/Project";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom React Query hook for fetching and caching the list of projects.
 *
 * @returns A React Query result object containing:
 * - `data`: Array of Project objects when successfully fetched
 * - `error`: Error object if the query fails
 * - `isLoading`: Boolean indicating if the query is in loading state
 * - `isError`: Boolean indicating if the query has errored
 * - Other standard React Query return values
 *
 * @remarks
 * - Uses a 5-minute stale time, meaning data is considered fresh for 5 minutes
 * - Garbage collection time is set to 10 minutes
 * - Automatically retries failed requests up to 2 times
 * - Query key is stored in `QUERY_KEYS.projects` for cache management
 *
 * @example
 * ```tsx
 * function ProjectsList() {
 *   const { data: projects, isLoading, error } = useProjects();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <ul>
 *       {projects?.map(project => <li key={project.id}>{project.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useProjects() {
  return useQuery<Project[], Error>({
    queryKey: QUERY_KEYS.project.all,
    queryFn: () => projectRepository.findAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
