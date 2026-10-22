import type { Task } from "@/domain/models/Task";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useChangeTaskAssignee } from "./useChangeTaskAssignee";
import { useChangeTaskStatus } from "./useChangeTaskStatus";
import { useMoveTask } from "./useMoveTask";

/**
 * Task status, assignee and project are changed by picking in a modal, each via its own endpoint
 * (ADR-0002). Picking the current value sends no request.
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
