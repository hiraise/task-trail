import { useCallback } from "react";

import { MODAL_TYPE, ModalType, useTaskModal } from "@/app/tasks/TaskModalContext";
import { TaskStatus } from "@/domain/task/task.entity";
import { MembersData } from "@/presentation/widgets/projects/MembersList/MembersList.mock";
import { Project } from "@/domain/project/project.entity";

export const useTaskModals = () => {
  const { open } = useTaskModal();

  const safeOpen = useCallback(
    async <T>(type: ModalType, props?: unknown): Promise<T | undefined> => {
      try {
        return await open<T>(type, props);
      } catch {
        return undefined;
      }
    },
    [open]
  );

  return {
    showChangeSatus: () => safeOpen<TaskStatus>(MODAL_TYPE.CHANGE_STATUS),

    showSelectAssignee: (userId?: number) =>
      safeOpen<MembersData>(MODAL_TYPE.SELECT_ASSIGNEE, { userId }),

    showSelectProject: (projectId?: number) =>
      safeOpen<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId }),

    showSortTasks: () => safeOpen<void>(MODAL_TYPE.SORT_TASKS),

    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
  };
};
