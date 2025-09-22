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

export interface ActionProps {
  id: number;
  title: string;
  type: "task" | "project";
}

/**
 * Custom hook providing a set of functions to open global modals throughout the application.
 * Each function corresponds to a specific modal type and returns a Promise that resolves with the modal's result,
 * or `undefined` if the modal was closed or an error occurred.
 *
 * @returns An object containing methods to open various global modals:
 * - `showSelectAssignee(props?)`: Opens the "Select Assignee" modal. Returns selected `MembersData` or `undefined`.
 * - `showSelectProject(projectId?)`: Opens the "Select Project" modal. Returns selected `Project` or `undefined`.
 * - `showChangeStatus(props?)`: Opens the "Change Status" modal. Returns selected `TaskStatus` or `undefined`.
 * - `showSortOptions()`: Opens the "Sort Options" modal. Returns `void` or `undefined`.
 * - `showCreateTask()`: Opens the "Create Task" modal. Returns `void` or `undefined`.
 * - `showCreateProject()`: Opens the "Create Project" modal. Returns `void` or `undefined`.
 * - `showInviteUser()`: Opens the "Invite User" modal. Returns an array of invited user emails (`string[]`) or `undefined`.
 * - `showMoveToArchive(props?)`: Opens the "Move to Archive" modal. Returns `void` or `undefined`.
 * - `showDeleteItem(props?)`: Opens the "Delete Item" modal. Returns `void` or `undefined`.
 * - `showEditProject(props?)`: Opens the "Edit Project" modal. Returns a partial `Project` object or `undefined`.
 * - `showEditTask(props?)`: Opens the "Edit Task" modal. Returns a partial `Task` object or `undefined`.
 *
 * All modal functions are safe to use and will return `undefined` if the modal is dismissed or an error occurs.
 *
 * @example
 * ```tsx
 * const {
 *   showSelectAssignee,
 *   showCreateTask,
 * } = useGlobalModals();
 *
 * const handleAssign = async () => {
 *   const assignee = await showSelectAssignee();
 *   if (assignee) {
 *     // handle selected assignee
 *   }
 * };
 * ```
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

    // Common actions
    showMoveToArchive: (props?: ActionProps) =>
      safeOpen<void>(MODAL_TYPE.MOVE_TO_ARCHIVE, { ...props }),
    showDeleteItem: (props?: ActionProps) => safeOpen<void>(MODAL_TYPE.DELETE, { ...props }),

    // Project actions
    showEditProject: (props?: EditProjectProps) =>
      safeOpen<Partial<Project>>(MODAL_TYPE.EDIT_PROJECT, { ...props }),

    // Task actions
    showEditTask: (props?: EditTaskProps) =>
      safeOpen<Partial<Task>>(MODAL_TYPE.EDIT_TASK, { ...props }),
  };
};
