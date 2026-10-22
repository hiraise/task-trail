import type { Task } from "@/domain/models/Task";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useChangeTaskAssignee } from "./useChangeTaskAssignee";
import { useChangeTaskStatus } from "./useChangeTaskStatus";
import { useMoveTask } from "./useMoveTask";

/**
 * Статус, ответственный и проект задачи меняются выбором в окне, каждый своим эндпоинтом
 * (ADR-0002). Выбрали то же, что было, — запроса нет.
 */
export function useTaskActions(task: Task) {
  const { showChangeStatus, showSelectAssignee, showSelectProject } = useGlobalModals();
  const { mutate: changeStatus } = useChangeTaskStatus();
  const { mutate: changeAssignee } = useChangeTaskAssignee();
  const { mutate: move } = useMoveTask();

  return {
    changeStatus: async () => {
      const statusId = await showChangeStatus({ statusId: task.statusId });

      if (statusId && statusId !== task.statusId) changeStatus({ taskId: task.id, statusId });
    },

    selectAssignee: async () => {
      const member = await showSelectAssignee({
        projectId: task.projectId,
        userId: task.assigneeId,
      });

      if (member && member.id !== task.assigneeId) {
        changeAssignee({ taskId: task.id, assigneeId: member.id });
      }
    },

    selectProject: async () => {
      const project = await showSelectProject(task.projectId);

      if (project && project.id !== task.projectId) move({ task, project });
    },
  };
}
