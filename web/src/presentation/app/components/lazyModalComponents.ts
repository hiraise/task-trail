import { lazy } from "react";

export const CreateTaskModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.CreateTaskModal })),
);

export const ChangeTaskStatusModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({
    default: m.ChangeTaskStatusModal,
  })),
);

export const ChangeTaskPriorityModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({
    default: m.ChangeTaskPriorityModal,
  })),
);

export const ChangeDueDateModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({
    default: m.ChangeDueDateModal,
  })),
);

export const EditTaskModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.EditTaskModal })),
);

export const SelectAssigneeModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.SelectAssigneeModal })),
);

export const SelectLabelsModal = lazy(() =>
  import("@/presentation/features/labels/modals").then((m) => ({ default: m.SelectLabelsModal })),
);

export const ProjectLabelsModal = lazy(() =>
  import("@/presentation/features/labels/modals").then((m) => ({ default: m.ProjectLabelsModal })),
);

export const SelectProjectModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.SelectProjectModal })),
);

export const SelectParentModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.SelectParentModal })),
);

export const CreateProjectModal = lazy(() =>
  import("@/presentation/features/projects/modals").then((m) => ({
    default: m.CreateProjectModal,
  })),
);

export const EditProjectModal = lazy(() =>
  import("@/presentation/features/projects/modals").then((m) => ({ default: m.EditProjectModal })),
);

export const InviteUserModal = lazy(() =>
  import("@/presentation/features/projects/modals").then((m) => ({ default: m.InviteUserModal })),
);

export const InvitationResultsModal = lazy(() =>
  import("@/presentation/features/projects/modals").then((m) => ({
    default: m.InvitationResultsModal,
  })),
);

export const LeaveProjectModal = lazy(() =>
  import("@/presentation/features/projects/modals").then((m) => ({ default: m.LeaveProjectModal })),
);

export const MemberActionsModal = lazy(() =>
  import("@/presentation/features/projects/modals").then((m) => ({
    default: m.MemberActionsModal,
  })),
);

export const ProjectSettingsModal = lazy(() =>
  import("@/presentation/features/projects/modals").then((m) => ({
    default: m.ProjectSettingsModal,
  })),
);

export const CropImageModal = lazy(() =>
  import("@/presentation/features/user/modals").then((m) => ({ default: m.CropImageModal })),
);

export const DeleteItemModal = lazy(() =>
  import("@/presentation/shared/modals").then((m) => ({ default: m.DeleteItemModal })),
);

export const MoveToArchiveModal = lazy(() =>
  import("@/presentation/shared/modals").then((m) => ({ default: m.MoveToArchiveModal })),
);

export const SortItemsModal = lazy(() =>
  import("@/presentation/shared/modals").then((m) => ({ default: m.SortItemsModal })),
);

export const TaskModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.TaskModal })),
);

export const TaskSettingsModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.TaskSettingsModal })),
);

export const ConfirmModal = lazy(() =>
  import("@/presentation/shared/modals").then((m) => ({ default: m.ConfirmModal })),
);

export const AdminUserActionsModal = lazy(() =>
  import("@/presentation/features/admin/modals").then((m) => ({
    default: m.AdminUserActionsModal,
  })),
);

export const PasswordResetLinkModal = lazy(() =>
  import("@/presentation/features/admin/modals").then((m) => ({
    default: m.PasswordResetLinkModal,
  })),
);

export const CreateBoardModal = lazy(() =>
  import("@/presentation/features/boards/modals").then((m) => ({ default: m.CreateBoardModal })),
);

export const SelectBoardProjectsModal = lazy(() =>
  import("@/presentation/features/boards/modals").then((m) => ({ default: m.SelectBoardProjectsModal })),
);

export const SelectBoardMembersModal = lazy(() =>
  import("@/presentation/features/boards/modals").then((m) => ({ default: m.SelectBoardMembersModal })),
);

export const RenameBoardModal = lazy(() =>
  import("@/presentation/features/boards/modals").then((m) => ({ default: m.RenameBoardModal })),
);

export const BoardSettingsModal = lazy(() =>
  import("@/presentation/features/boards/modals").then((m) => ({ default: m.BoardSettingsModal })),
);
