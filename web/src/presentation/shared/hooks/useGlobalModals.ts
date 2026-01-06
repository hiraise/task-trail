import { useCallback } from "react";

import type { ProjectMemberResponseDto } from "@/application/dto/ProjectMemberResponseDto";
import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import type { TaskStatusResponseDto } from "@/application/dto/TaskStatusResponseDto";
import type { ModalType } from "@/presentation/app";
import { MODAL_TYPE, useGlobalModalContext } from "@/presentation/app";

export interface ChangeStatusProps {
  currentStatus?: TaskStatusResponseDto;
  projectId?: number;
}

export interface SelectAssigneeProps {
  projectId?: string | number;
  userId?: string | number;
}

export interface EditTaskProps {
  taskId: string | number;
  title: string;
  description?: string;
}

export interface EditProjectProps {
  projectId: string | number;
  name: string;
  description?: string;
}

export interface LeaveProjectProps {
  id: number;
  title: string;
}

export interface MemberActionsProps {
  memberId: number;
  memberDisplayName: string;
  currentUserId: number;
  projectId: number;
}

export interface ActionProps {
  id: number;
  title: string;
  type: "task" | "project" | "member";
}

/**
 * Custom hook providing a set of functions to open global modals throughout the application.
 * Each function corresponds to a specific modal type and returns a Promise that resolves with the modal's result,
 * or `undefined` if the modal was closed or an error occurred.
 *
 * @returns An object containing methods to open various global modals:
 * - `closeAllModals()`: Closes all modals in the stack at once.
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
 *   closeAllModals,
 * } = useGlobalModals();
 *
 * const handleAssign = async () => {
 *   const assignee = await showSelectAssignee();
 *   if (assignee) {
 *     // handle selected assignee
 *   }
 * };
 *
 * const handleCloseAll = () => {
 *   closeAllModals(); // Closes all open modals
 * };
 * ```
 */
export const useGlobalModals = () => {
  const { open, closeAll } = useGlobalModalContext();

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
    // Control actions
    closeAllModals: closeAll,

    // Selection modals
    showSelectProject: (projectId?: string | number) =>
      safeOpen<ProjectResponseDto>(MODAL_TYPE.SELECT_PROJECT, { projectId }),
    showSortOptions: () => safeOpen<void>(MODAL_TYPE.SORT_ITEMS),

    // Creation modals
    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
    showCreateProject: () => safeOpen<void>(MODAL_TYPE.CREATE_PROJECT),
    showInviteUser: () => safeOpen<string[]>(MODAL_TYPE.INVITE_USER),

    // Common actions
    showMoveToArchive: (props?: ActionProps) =>
      safeOpen<number>(MODAL_TYPE.MOVE_TO_ARCHIVE, { ...props }),
    showDeleteItem: (props?: ActionProps) => safeOpen<number>(MODAL_TYPE.DELETE, { ...props }),
    showCropImage: (file?: File) => safeOpen<File>(MODAL_TYPE.CROP_IMAGE, { file }),

    // Project actions
    showEditProject: (props?: EditProjectProps) =>
      safeOpen<void>(MODAL_TYPE.EDIT_PROJECT, { ...props }),
    showLeaveProject: (props: LeaveProjectProps) =>
      safeOpen<number>(MODAL_TYPE.LEAVE_PROJECT, { ...props }),
    showProjectSettings: () => safeOpen<void>(MODAL_TYPE.PROJECT_SETTINGS),
    showMemberActions: (props: MemberActionsProps) =>
      safeOpen<void>(MODAL_TYPE.MEMBER_ACTIONS, { ...props }),

    // Task actions
    showEditTask: (props?: EditTaskProps) => safeOpen<void>(MODAL_TYPE.EDIT_TASK, { ...props }),
    showTaskSettings: (task: TaskResponseDto) => safeOpen<void>(MODAL_TYPE.TASK_SETTINGS, { task }),
    showChangeStatus: (props?: ChangeStatusProps) =>
      safeOpen<TaskStatusResponseDto>(MODAL_TYPE.CHANGE_STATUS, { ...props }),
    showSelectAssignee: (props?: SelectAssigneeProps) =>
      safeOpen<ProjectMemberResponseDto>(MODAL_TYPE.SELECT_ASSIGNEE, { ...props }),
  };
};
