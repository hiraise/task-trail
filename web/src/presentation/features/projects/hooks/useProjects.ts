import { useQuery } from "@tanstack/react-query";

import type { Project } from "@/domain/models/Project";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Projects where the current user is a member: active ones, or archived ones (ADR-0027). */
export function useProjects(archived = false, { enabled = true } = {}) {
  return useQuery<Project[], Error>({
    queryKey: QUERY_KEYS.project.list(archived),
    queryFn: () => projectRepository.findAll(archived),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled,
  });
}
