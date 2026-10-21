import { lazy } from "react";

export const CreateTaskModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.CreateTaskModal })),
);

export const ChangeTaskStatusModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({
    default: m.ChangeTaskStatusModal,
  })),
);

export const EditTaskModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.EditTaskModal })),
);

export const SelectAssigneeModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.SelectAssigneeModal })),
);

export const SelectProjectModal = lazy(() =>
  import("@/presentation/features/tasks/modals").then((m) => ({ default: m.SelectProjectModal })),
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

export const TaskSettingsModal = lazy(() =>
  import("@/presentation/shared/modals").then((m) => ({ default: m.TaskSettingsModal })),
);
