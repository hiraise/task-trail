import { useCallback } from "react";

import type { AdminUser } from "@/domain/models/AdminUser";
import type { InvitationResult } from "@/domain/models/Invitation";
import type { PasswordResetLink } from "@/domain/models/PasswordResetLink";
import type { Project } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";
import type { ProjectId, TaskId, TaskStatusId, UserId } from "@/domain/types";
import type { ModalType } from "@/presentation/app";
import { MODAL_TYPE, useGlobalModalContext } from "@/presentation/app";

export interface ChangeStatusProps {
  /** Current task status */
  statusId?: TaskStatusId;
}

export interface SelectAssigneeProps {
  /** Assignee: from this project's members; no project, nobody to choose from */
  projectId?: ProjectId;
  /** Current assignee */
  userId?: UserId;
}

export interface TaskProps {
  task: Task;
}

export interface EditProjectProps {
  projectId: ProjectId;
  name: string;
  description?: string;
  /** Only for the owner: the others do not see the key field (canChangeProjectKey) */
  key?: string;
}

export interface LeaveProjectProps {
  id: ProjectId;
  title: string;
}

export interface MemberActionsProps {
  member: ProjectMember;
  projectId: ProjectId;
}

export interface InviteUserProps {
  /** Project being invited to: candidates exclude its members. Without it, a new project */
  projectId?: ProjectId;
  /** Emails selected earlier */
  emails?: string[];
}

export interface InvitationResultsProps {
  projectId: ProjectId;
  results: InvitationResult[];
}

export interface ActionProps {
  id: TaskId | ProjectId | UserId;
  title: string;
  type: "task" | "project" | "member";
}

export interface ConfirmProps {
  title: string;
  description?: string;
  /** Action button text: "Disable", "Revoke rights" */
  confirmText: string;
}

export interface AdminUserActionsProps {
  user: AdminUser;
}

export interface PasswordResetLinkProps {
  /** Who the link is for: name or email */
  name: string;
  link: PasswordResetLink;
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
    showSelectProject: (projectId?: ProjectId) =>
      safeOpen<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId }),
    showSortOptions: () => safeOpen<void>(MODAL_TYPE.SORT_ITEMS),

    // Creation modals
    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
    showCreateProject: () => safeOpen<void>(MODAL_TYPE.CREATE_PROJECT),
    showInviteUser: (props?: InviteUserProps) =>
      safeOpen<string[]>(MODAL_TYPE.INVITE_USER, { ...props }),
    showInvitationResults: (props: InvitationResultsProps) =>
      safeOpen<void>(MODAL_TYPE.INVITATION_RESULTS, { ...props }),

    // Common actions
    showMoveToArchive: (props?: ActionProps) =>
      safeOpen<number>(MODAL_TYPE.MOVE_TO_ARCHIVE, { ...props }),
    showDeleteItem: (props?: ActionProps) =>
      safeOpen<TaskId | ProjectId | UserId>(MODAL_TYPE.DELETE, { ...props }),
    showCropImage: (file?: File) => safeOpen<File>(MODAL_TYPE.CROP_IMAGE, { file }),
    /** Consent is `true`; refusal or closing is `undefined` */
    showConfirm: (props: ConfirmProps) => safeOpen<boolean>(MODAL_TYPE.CONFIRM, { ...props }),

    // Admin actions
    showAdminUserActions: (props: AdminUserActionsProps) =>
      safeOpen<void>(MODAL_TYPE.ADMIN_USER_ACTIONS, { ...props }),
    showPasswordResetLink: (props: PasswordResetLinkProps) =>
      safeOpen<void>(MODAL_TYPE.PASSWORD_RESET_LINK, { ...props }),

    // Project actions
    showEditProject: (props?: EditProjectProps) =>
      safeOpen<void>(MODAL_TYPE.EDIT_PROJECT, { ...props }),
    showLeaveProject: (props: LeaveProjectProps) =>
      safeOpen<ProjectId | null>(MODAL_TYPE.LEAVE_PROJECT, { ...props }),
    showProjectSettings: (projectId: ProjectId) =>
      safeOpen<void>(MODAL_TYPE.PROJECT_SETTINGS, { projectId }),
    showMemberActions: (props: MemberActionsProps) =>
      safeOpen<void>(MODAL_TYPE.MEMBER_ACTIONS, { ...props }),

    // Task actions
    showEditTask: (task: Task) => safeOpen<void>(MODAL_TYPE.EDIT_TASK, { task }),
    showTaskSettings: (task: Task) => safeOpen<void>(MODAL_TYPE.TASK_SETTINGS, { task }),
    showChangeStatus: (props?: ChangeStatusProps) =>
      safeOpen<TaskStatusId>(MODAL_TYPE.CHANGE_STATUS, { ...props }),
    showSelectAssignee: (props?: SelectAssigneeProps) =>
      safeOpen<ProjectMember>(MODAL_TYPE.SELECT_ASSIGNEE, { ...props }),
  };
};
