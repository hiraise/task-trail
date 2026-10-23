import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ProjectId } from "@/domain/types";
import { projectMemberRepository, projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Project page: the project with the current user's role and members. Tasks are loaded by
 * the project tasks section itself: it has its own tabs (ADR-0027).
 */
export const useProjectDetail = (projectId: ProjectId) => {
  const [projectQuery, membersQuery] = useQueries({
    queries: [
      {
        queryKey: QUERY_KEYS.project.detail(projectId),
        queryFn: () => projectRepository.findById(projectId),
      },
      {
        queryKey: QUERY_KEYS.project.members(projectId),
        queryFn: () => projectMemberRepository.findByProjectId(projectId),
      },
    ],
  });

  const data = useMemo(() => {
    if (!projectQuery.data || !membersQuery.data) return undefined;

    return {
      project: projectQuery.data,
      members: membersQuery.data,
      owner: membersQuery.data.find((member) => member.role === "owner"),
    };
  }, [projectQuery.data, membersQuery.data]);

  return {
    data,
    isLoading: projectQuery.isLoading || membersQuery.isLoading,
    isError: projectQuery.isError || membersQuery.isError,
    error: projectQuery.error || membersQuery.error,
  };
};
