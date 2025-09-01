import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Project } from "@/domain/project/project.entity";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { useGetProjectMembers, useGetTasks } from "./useProject";

export const useGetProjectData = () => {
  const params = useParams();
  const projectId = Number(params.id);

  const queryClient = useQueryClient();
  const project = queryClient.getQueryData<Project>(QUERY_KEYS.project(projectId));

  const { data: members } = useGetProjectMembers(projectId);
  const owner = members?.find((m) => m.isOwner)?.username || "Unknown";

  const { data: tasks } = useGetTasks();

  return { project, owner, projectId, tasks };
};
