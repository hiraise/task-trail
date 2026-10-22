import type { ProjectId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useCreateTaskFormStore } from "../store/createTaskFormStore";

/** Открывает форму новой задачи; со страницы проекта — сразу с этим проектом. */
export function useOpenCreateTask() {
  const { showCreateTask } = useGlobalModals();
  const setProjectId = useCreateTaskFormStore((state) => state.setProjectId);

  return (projectId?: ProjectId) => {
    if (projectId) setProjectId(projectId);

    return showCreateTask();
  };
}
