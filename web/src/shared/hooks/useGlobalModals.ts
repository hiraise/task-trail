import { useCallback } from "react";

import { MODAL_TYPE, ModalType, useGlobalModalContext } from "@/app/_components/GlobalModalContext";
import { Task, TaskStatus } from "@/domain/task/task.entity";
import { Project } from "@/domain/project/project.entity";
import { MembersData } from "@/domain/user/user.entity";

export interface ChangeStatusProps {
  currentStatus?: TaskStatus;
  projectId?: number;
}

export interface SelectAssigneeProps {
  projectId?: number;
  userId?: number;
}

export interface EditTaskProps {
  title: string;
  description?: string;
}

export interface TaskActionProps {
  id: number;
  title: string;
}

export const useGlobalModals = () => {
  const { open } = useGlobalModalContext();

  const safeOpen = useCallback(
    async <T>(type: ModalType, props?: Record<string, unknown>): Promise<T | undefined> => {
      try {
        return await open<T>(type, props);
      } catch {
        return undefined;
      }
    },
    [open]
  );

  return {
    showSelectAssignee: (props?: SelectAssigneeProps) =>
      safeOpen<MembersData>(MODAL_TYPE.SELECT_ASSIGNEE, { ...props }),

    showSelectProject: (projectId?: number) =>
      safeOpen<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId }),

    showChangeStatus: (props?: ChangeStatusProps) =>
      safeOpen<TaskStatus>(MODAL_TYPE.CHANGE_STATUS, { ...props }),
    showSortOptions: () => safeOpen<void>(MODAL_TYPE.SORT_ITEMS),
    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
    showCreateProject: () => safeOpen<void>(MODAL_TYPE.CREATE_PROJECT),
    showInviteUser: () => safeOpen<string[]>(MODAL_TYPE.INVITE_USER),
    showEditTask: (props?: EditTaskProps) =>
      safeOpen<Partial<Task>>(MODAL_TYPE.EDIT_TASK, { ...props }),
    showMoveToArchive: (props?: TaskActionProps) =>
      safeOpen<void>(MODAL_TYPE.MOVE_TO_ARCHIVE, { ...props }),
    showDeleteTask: (props?: TaskActionProps) =>
      safeOpen<void>(MODAL_TYPE.DELETE_TASK, { ...props }),
  };
};
