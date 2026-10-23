import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useCreateTaskFormStore } from "../store/createTaskFormStore";

/**
 * Opens the new task form; from a project page — with that project preselected, from a board —
 * with the choice limited to the board projects (`allowedProjectIds`).
 */
export function useOpenCreateTask() {
  const { showCreateTask } = useGlobalModals();
  const setProjectId = useCreateTaskFormStore((state) => state.setProjectId);
  const limitProjects = useCreateTaskFormStore((state) => state.limitProjects);

  return (projectId?: ProjectId, allowedProjectIds?: ProjectId[]) => {
    if (projectId) setProjectId(projectId);
    limitProjects(allowedProjectIds);

    return showCreateTask();
  };
}
