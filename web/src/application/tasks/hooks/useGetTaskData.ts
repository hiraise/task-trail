import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { Project, ProjectMember } from "@/domain/project/project.entity";
import { useParams } from "next/navigation";

interface GetTaskDataProps {
  assigneeId?: number;
  projectId?: number;
}

export const useGetTaskData = ({ assigneeId, projectId }: GetTaskDataProps) => {
  const queryClient = useQueryClient();
  const projects = queryClient.getQueryData<Project[]>(QUERY_KEYS.projects) ?? [];
  const members = projectId
    ? queryClient.getQueryData<ProjectMember[]>(QUERY_KEYS.projectMembers(projectId)) ?? []
    : [];

  const params = useParams();
  const currentProjectId = Number(params.id);

  const project = projects.find((p) =>
    projectId ? p.id === projectId : p.id === currentProjectId
  );
  const assignee = members.find((m) => m.id === assigneeId);

  return { project, assignee };
};
