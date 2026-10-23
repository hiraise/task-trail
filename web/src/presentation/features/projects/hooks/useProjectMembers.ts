import { type UseQueryResult, useQueries, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId, UserId } from "@/domain/types";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

const projectMembersQuery = (projectId: ProjectId) => ({
  queryKey: QUERY_KEYS.project.members(projectId || ""),
  queryFn: () => projectMemberRepository.findByProjectId(projectId),
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  enabled: !!projectId,
});

/** Members of the project; nothing is loaded without a project. */
export function useProjectMembers(projectId: ProjectId) {
  return useQuery<ProjectMember[], Error>(projectMembersQuery(projectId));
}

/**
 * Member IDs of several projects, like the visible projects of a board; a project whose members
 * are still loading is absent from the map.
 */
export function useProjectsMemberIds(projectIds: ProjectId[]): ReadonlyMap<ProjectId, ReadonlySet<UserId>> {
  const key = projectIds.join();
  // combine runs again only when it or a query result changes: the map keeps its identity
  const combine = useCallback(
    (results: UseQueryResult<ProjectMember[]>[]) => {
      const ids = key.split(",");
      const map = new Map<ProjectId, ReadonlySet<UserId>>();

      results.forEach(({ data }, i) => {
        if (data) map.set(ids[i], new Set(data.map((member) => member.id)));
      });

      return map;
    },
    [key],
  );

  return useQueries({ queries: projectIds.map(projectMembersQuery), combine });
}
