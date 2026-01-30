import { useCallback } from "react";

import type { Project } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";
import type { TaskStatus } from "@/domain/models/TaskStatus";
import type { ProjectId, TaskId, UserId } from "@/domain/types";
import type { ModalType } from "@/presentation/app";
import { MODAL_TYPE, useGlobalModalContext } from "@/presentation/app";

export interface ChangeStatusProps {
  currentStatus?: TaskStatus;
  projectId?: ProjectId;
}

export interface SelectAssigneeProps {
  projectId?: ProjectId;
  userId?: UserId;
}

export interface EditTaskProps {
  taskId: TaskId;
  title: string;
  description?: string;
}

export interface EditProjectProps {
  projectId: ProjectId;
  name: string;
  description?: string;
}

export interface LeaveProjectProps {
  id: ProjectId;
  title: string;
}

export interface MemberActionsProps {
  memberId: UserId;
  memberDisplayName: string;
  currentUserId: UserId;
  projectId: ProjectId;
}

export interface ActionProps {
  id: TaskId | ProjectId | UserId;
  title: string;
  type: "task" | "project" | "member";
}

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
    [open],
  );

  return {
    // Control actions
    closeAllModals: closeAll,

    // Selection modals
    showSelectProject: (projectId?: string | number) =>
      safeOpen<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId }),
    showSortOptions: () => safeOpen<void>(MODAL_TYPE.SORT_ITEMS),

    // Creation modals
    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
    showCreateProject: () => safeOpen<void>(MODAL_TYPE.CREATE_PROJECT),
    showInviteUser: () => safeOpen<string[]>(MODAL_TYPE.INVITE_USER),

    // Common actions
    showMoveToArchive: (props?: ActionProps) =>
      safeOpen<number>(MODAL_TYPE.MOVE_TO_ARCHIVE, { ...props }),
    showDeleteItem: (props?: ActionProps) =>
      safeOpen<TaskId | ProjectId | UserId>(MODAL_TYPE.DELETE, { ...props }),
    showCropImage: (file?: File) => safeOpen<File>(MODAL_TYPE.CROP_IMAGE, { file }),

    // Project actions
    showEditProject: (props?: EditProjectProps) =>
      safeOpen<void>(MODAL_TYPE.EDIT_PROJECT, { ...props }),
    showLeaveProject: (props: LeaveProjectProps) =>
      safeOpen<ProjectId | null>(MODAL_TYPE.LEAVE_PROJECT, { ...props }),
    showProjectSettings: () => safeOpen<void>(MODAL_TYPE.PROJECT_SETTINGS),
    showMemberActions: (props: MemberActionsProps) =>
      safeOpen<void>(MODAL_TYPE.MEMBER_ACTIONS, { ...props }),

    // Task actions
    showEditTask: (props?: EditTaskProps) => safeOpen<void>(MODAL_TYPE.EDIT_TASK, { ...props }),
    showTaskSettings: (task: Task) => safeOpen<void>(MODAL_TYPE.TASK_SETTINGS, { task }),
    showChangeStatus: (props?: ChangeStatusProps) =>
      safeOpen<TaskStatus>(MODAL_TYPE.CHANGE_STATUS, { ...props }),
    showSelectAssignee: (props?: SelectAssigneeProps) =>
      safeOpen<ProjectMember>(MODAL_TYPE.SELECT_ASSIGNEE, { ...props }),
  };
};
