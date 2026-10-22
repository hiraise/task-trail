import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ProjectId } from "@/domain/types";
import {
  projectMemberRepository,
  projectRepository,
  taskRepository,
} from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Project page: the project with the current user's role, members and tasks. */
export const useProjectDetail = (projectId: ProjectId) => {
  const [projectQuery, membersQuery, tasksQuery] = useQueries({
    queries: [
      {
        queryKey: QUERY_KEYS.project.detail(projectId),
        queryFn: () => projectRepository.findById(projectId),
      },
      {
        queryKey: QUERY_KEYS.project.members(projectId),
        queryFn: () => projectMemberRepository.findByProjectId(projectId),
      },
      {
        queryKey: QUERY_KEYS.project.tasks(projectId),
        queryFn: () => taskRepository.findByProjectId(projectId),
      },
    ],
  });

  const data = useMemo(() => {
    if (!projectQuery.data || !membersQuery.data || !tasksQuery.data) return undefined;

    return {
      project: projectQuery.data,
      members: membersQuery.data,
      owner: membersQuery.data.find((member) => member.role === "owner"),
      tasks: tasksQuery.data,
    };
  }, [projectQuery.data, membersQuery.data, tasksQuery.data]);

  return {
    data,
    isLoading: projectQuery.isLoading || membersQuery.isLoading || tasksQuery.isLoading,
    isError: projectQuery.isError || membersQuery.isError || tasksQuery.isError,
    error: projectQuery.error || membersQuery.error || tasksQuery.error,
  };
};
