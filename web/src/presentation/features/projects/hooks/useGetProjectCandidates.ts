import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { User } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useGetProjectCandidates(projectId?: ProjectId): UseQueryResult<User[], Error> {
  const { findCandidatesForProject } = appContainer.repositories.user;

  return useQuery({
    queryKey: QUERY_KEYS.projectCandidates(projectId),
    queryFn: async () => findCandidatesForProject(projectId),
  });
}
