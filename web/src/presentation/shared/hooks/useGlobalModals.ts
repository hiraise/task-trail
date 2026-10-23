import { useCallback } from "react";

import type { AdminUser } from "@/domain/models/AdminUser";
import type { BoardProject } from "@/domain/models/Board";
import type { InvitationResult } from "@/domain/models/Invitation";
import type { PasswordResetLink } from "@/domain/models/PasswordResetLink";
import type { Project } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";
import type { User } from "@/domain/models/User";
import type { BoardId, ProjectId, TaskId, TaskPriorityId, TaskStatusId, UserId } from "@/domain/types";
import type { ModalType } from "@/presentation/app";
import { MODAL_TYPE, useGlobalModalContext } from "@/presentation/app";
import type { SortOptionValue } from "@/shared/utils/sortItems";

export interface ChangeStatusProps {
  /** Current task status */
  statusId?: TaskStatusId;
}

export interface ChangePriorityProps {
  /** Current task priority */
  priority?: TaskPriorityId;
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

export interface TaskModalProps {
  taskId: TaskId;
}

export interface EditProjectProps {
  projectId: ProjectId;
  name: string;
  description?: string;
  /** Only for the owner: the others do not see the key field (canChangeProjectKey) */
  key?: string;
}

export interface LeaveProjectProps {
  id: ProjectId | BoardId;
  title: string;
  /** What is left; a project by default */
  kind?: "project" | "board";
}

export interface SelectBoardProjectsProps {
  /** Projects selected now */
  selectedIds: ProjectId[];
  /**
   * Board projects that are not among the user's active projects (archived ones): they are listed too,
   * so that they can be kept or removed
   */
  extraProjects?: BoardProject[];
  /** "Select" in the new board form, "Save changes" on the board */
  applyText: string;
}

export interface SelectBoardMembersProps {
  /** People selected now */
  selectedIds: UserId[];
  /** Already on the board: not listed */
  excludeIds?: UserId[];
  applyText: string;
}

export interface RenameBoardProps {
  boardId: BoardId;
  name: string;
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
  id: TaskId | ProjectId | UserId | BoardId;
  title: string;
  type: "task" | "project" | "member" | "board";
}

export interface SortOptionsProps {
  current: SortOptionValue;
  /** A task list: task-only options are shown too (TASK_SORT_OPTIONS) */
  tasks?: boolean;
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
    /** `allowedProjectIds` — only these projects are offered (a new task from a board) */
    showSelectProject: (projectId?: ProjectId, allowedProjectIds?: ProjectId[]) =>
      safeOpen<Project>(MODAL_TYPE.SELECT_PROJECT, { projectId, allowedProjectIds }),
    /** Opens with the current option; the chosen one is returned, closing — `undefined` */
    showSortOptions: (current: SortOptionValue, tasks?: boolean) =>
      safeOpen<SortOptionValue>(MODAL_TYPE.SORT_ITEMS, { current, tasks }),

    // Creation modals
    showCreateTask: () => safeOpen<void>(MODAL_TYPE.CREATE_TASK),
    showCreateProject: () => safeOpen<void>(MODAL_TYPE.CREATE_PROJECT),
    showInviteUser: (props?: InviteUserProps) =>
      safeOpen<string[]>(MODAL_TYPE.INVITE_USER, { ...props }),
    showInvitationResults: (props: InvitationResultsProps) =>
      safeOpen<void>(MODAL_TYPE.INVITATION_RESULTS, { ...props }),

    // Common actions
    /** Consent is the item ID; refusal or closing is `undefined` */
    showMoveToArchive: (props?: ActionProps) =>
      safeOpen<TaskId | ProjectId>(MODAL_TYPE.MOVE_TO_ARCHIVE, { ...props }),
    showDeleteItem: (props?: ActionProps) =>
      safeOpen<TaskId | ProjectId | UserId | BoardId>(MODAL_TYPE.DELETE, { ...props }),
    showCropImage: (file?: File) => safeOpen<File>(MODAL_TYPE.CROP_IMAGE, { file }),
    /** Consent is `true`; refusal or closing is `undefined` */
    showConfirm: (props: ConfirmProps) => safeOpen<boolean>(MODAL_TYPE.CONFIRM, { ...props }),

    // Admin actions
    showAdminUserActions: (props: AdminUserActionsProps) =>
      safeOpen<void>(MODAL_TYPE.ADMIN_USER_ACTIONS, { ...props }),
    showPasswordResetLink: (props: PasswordResetLinkProps) =>
      safeOpen<void>(MODAL_TYPE.PASSWORD_RESET_LINK, { ...props }),

    // Board actions (ADR-0029)
    showCreateBoard: () => safeOpen<void>(MODAL_TYPE.CREATE_BOARD),
    /** The chosen project IDs; closing — `undefined` */
    showSelectBoardProjects: (props: SelectBoardProjectsProps) =>
      safeOpen<ProjectId[]>(MODAL_TYPE.SELECT_BOARD_PROJECTS, { ...props }),
    /** The chosen people; closing — `undefined` */
    showSelectBoardMembers: (props: SelectBoardMembersProps) =>
      safeOpen<User[]>(MODAL_TYPE.SELECT_BOARD_MEMBERS, { ...props }),
    showRenameBoard: (props: RenameBoardProps) => safeOpen<void>(MODAL_TYPE.RENAME_BOARD, { ...props }),
    showBoardSettings: (boardId: BoardId) => safeOpen<void>(MODAL_TYPE.BOARD_SETTINGS, { boardId }),

    // Project actions
    showEditProject: (props?: EditProjectProps) =>
      safeOpen<void>(MODAL_TYPE.EDIT_PROJECT, { ...props }),
    showLeaveProject: (props: LeaveProjectProps) =>
      safeOpen<ProjectId | BoardId | null>(MODAL_TYPE.LEAVE_PROJECT, { ...props }),
    showProjectSettings: (projectId: ProjectId) =>
      safeOpen<void>(MODAL_TYPE.PROJECT_SETTINGS, { projectId }),
    showMemberActions: (props: MemberActionsProps) =>
      safeOpen<void>(MODAL_TYPE.MEMBER_ACTIONS, { ...props }),

    // Task actions
    /** The task over the kanban, from 1024 px (stage 2 plan, step 5) */
    showTask: (taskId: TaskId) => safeOpen<void>(MODAL_TYPE.TASK, { taskId }),
    showEditTask: (task: Task) => safeOpen<void>(MODAL_TYPE.EDIT_TASK, { task }),
    showTaskSettings: (task: Task) => safeOpen<void>(MODAL_TYPE.TASK_SETTINGS, { task }),
    showChangeStatus: (props?: ChangeStatusProps) =>
      safeOpen<TaskStatusId>(MODAL_TYPE.CHANGE_STATUS, { ...props }),
    showChangePriority: (props?: ChangePriorityProps) =>
      safeOpen<TaskPriorityId>(MODAL_TYPE.CHANGE_PRIORITY, { ...props }),
    showSelectAssignee: (props?: SelectAssigneeProps) =>
      safeOpen<ProjectMember>(MODAL_TYPE.SELECT_ASSIGNEE, { ...props }),
  };
};
