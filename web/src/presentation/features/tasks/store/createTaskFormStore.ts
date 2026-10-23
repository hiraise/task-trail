import { create } from "zustand";

import type { ProjectId, TaskStatusId, UserId } from "@/domain/types";

// Draft of a new task. Modals open as a stack and only the top one is shown: while the project
// or assignee picker is open, the task form is unmounted, so its fields live here rather than
// in the form state. The draft is cleared after the task is created.

interface CreateTaskFormState {
  name: string;
  description: string;
  projectId?: ProjectId;
  /** Assignee — a member of the selected project; a non-member is not shown by the form */
  assigneeId?: UserId;
  /** From a board — only its projects can be chosen (ADR-0029); undefined — any project */
  allowedProjectIds?: ProjectId[];
  /**
   * From a kanban column — the column's status; the new task stays on the board instead of opening.
   * undefined — the default status, and the task opens after creation
   */
  statusId?: TaskStatusId;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setProjectId: (projectId: ProjectId) => void;
  setAssigneeId: (assigneeId?: UserId) => void;
  setStatusId: (statusId?: TaskStatusId) => void;
  /** Limits the project choice; a draft project outside the limit is cleared */
  limitProjects: (projectIds?: ProjectId[]) => void;
  reset: () => void;
}

const empty = {
  name: "",
  description: "",
  projectId: undefined,
  assigneeId: undefined,
  allowedProjectIds: undefined,
  statusId: undefined,
};

export const useCreateTaskFormStore = create<CreateTaskFormState>((set) => ({
  ...empty,
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setProjectId: (projectId) => set({ projectId }),
  setAssigneeId: (assigneeId) => set({ assigneeId }),
  setStatusId: (statusId) => set({ statusId }),
  limitProjects: (allowedProjectIds) =>
    set((state) => {
      if (!allowedProjectIds) return { allowedProjectIds };
      const keep = state.projectId && allowedProjectIds.includes(state.projectId);
      // The only board project is chosen right away
      const projectId = keep
        ? state.projectId
        : allowedProjectIds.length === 1
          ? allowedProjectIds[0]
          : undefined;

      return { allowedProjectIds, projectId };
    }),
  reset: () => set(empty),
}));
