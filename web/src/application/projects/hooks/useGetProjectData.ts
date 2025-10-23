import { useParams } from "next/navigation";

import { useGetById, useGetProjectMembers, useGetTasks } from "./useProject";

export const useGetProjectData = () => {
  const params = useParams();
  const projectId = Number(params.id);

  const { data: project } = useGetById(projectId);

  const { data: members } = useGetProjectMembers(projectId);
  const owner = members?.find((m) => m.isOwner)?.username || "Unknown";

  const { data: tasks } = useGetTasks();

  return { project, owner, projectId, tasks, members };
};
