import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useCreateTaskFormStore } from "../store/createTaskFormStore";

/** Opens the new task form; from a project page — with that project preselected. */
export function useOpenCreateTask() {
  const { showCreateTask } = useGlobalModals();
  const setProjectId = useCreateTaskFormStore((state) => state.setProjectId);

  return (projectId?: ProjectId) => {
    if (projectId) setProjectId(projectId);

    return showCreateTask();
  };
}
