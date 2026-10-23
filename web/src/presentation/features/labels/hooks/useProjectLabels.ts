import { useQuery } from "@tanstack/react-query";

import type { Label } from "@/domain/models/Label";
import type { ProjectId } from "@/domain/types";
import { labelRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Project labels ordered by name (ADR-0035); they change rarely, so the list stays fresh for 5 minutes. */
export function useProjectLabels(projectId: ProjectId) {
  return useQuery<Label[], Error>({
    queryKey: QUERY_KEYS.project.labels(projectId),
    queryFn: () => labelRepository.findByProject(projectId),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(projectId),
  });
}
