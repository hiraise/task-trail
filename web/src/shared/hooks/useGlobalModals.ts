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

export interface EditProjectProps {
  name: string;
  description?: string;
}

export interface TaskActionProps {
  id: number;
  title: string;
}

/**
 * Custom hook providing a set of functions to open global modal dialogs in the application.
 *
 * Each function opens a specific modal and returns a Promise that resolves with the modal's result,
 * or `undefined` if the modal was closed or an error occurred.
 *
 * @returns An object containing modal-opening functions:
 * - `showSelectAssignee(props?)`: Opens the "Select Assignee" modal.
 * - `showSelectProject(projectId?)`: Opens the "Select Project" modal.
 * - `showChangeStatus(props?)`: Opens the "Change Status" modal.
 * - `showSortOptions()`: Opens the "Sort Options" modal.
 * - `showCreateTask()`: Opens the "Create Task" modal.
 * - `showCreateProject()`: Opens the "Create Project" modal.
 * - `showInviteUser()`: Opens the "Invite User" modal.
 * - `showEditTask(props?)`: Opens the "Edit Task" modal.
 * - `showMoveToArchive(props?)`: Opens the "Move to Archive" modal.
 * - `showDeleteTask(props?)`: Opens the "Delete Task" modal.
 *
 * @example
 * const {
 *   showSelectAssignee,
 *   showCreateTask,
 * } = useGlobalModals();
 *
 * const handleAssign = async () => {
 *   const assignee = await showSelectAssignee();
 *   // handle selected assignee
 * };
 */
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
    // Selection modals
    showSelectAssignee: (props?: SelectAssigneeProps) =>
      safeOpen<MembersData>(MODAL_TYPE.SELECT_ASSIGNEE, { ...props }),

    showSelectProject: (projectId?: number) =>
      safeOpen<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId }),
    showChangeStatus: (props?: ChangeStatusProps) =>
      safeOpen<TaskStatus>(MODAL_TYPE.CHANGE_STATUS, { ...props }),
    showSortOptions: () => safeOpen<void>(MODAL_TYPE.SORT_ITEMS),

    // Creation modals
    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
    showCreateProject: () => safeOpen<void>(MODAL_TYPE.CREATE_PROJECT),
    showInviteUser: () => safeOpen<string[]>(MODAL_TYPE.INVITE_USER),

    // Project actions
    showEditProject: (props?: EditProjectProps) =>
      safeOpen<Partial<Project>>(MODAL_TYPE.EDIT_PROJECT, { ...props }),

    // Task actions
    showEditTask: (props?: EditTaskProps) =>
      safeOpen<Partial<Task>>(MODAL_TYPE.EDIT_TASK, { ...props }),
    showMoveToArchive: (props?: TaskActionProps) =>
      safeOpen<void>(MODAL_TYPE.MOVE_TO_ARCHIVE, { ...props }),
    showDeleteTask: (props?: TaskActionProps) =>
      safeOpen<void>(MODAL_TYPE.DELETE_TASK, { ...props }),
  };
};
