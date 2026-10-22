import { create } from "zustand";

import type { ProjectId, UserId } from "@/domain/types";

// Draft of a new task. Modals open as a stack and only the top one is shown: while the project
// or assignee picker is open, the task form is unmounted, so its fields live here rather than
// in the form state. The draft is cleared after the task is created.

interface CreateTaskFormState {
  name: string;
  description: string;
  projectId?: ProjectId;
  /** Assignee — a member of the selected project; a non-member is not shown by the form */
  assigneeId?: UserId;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setProjectId: (projectId: ProjectId) => void;
  setAssigneeId: (assigneeId?: UserId) => void;
  reset: () => void;
}

const empty = { name: "", description: "", projectId: undefined, assigneeId: undefined };

export const useCreateTaskFormStore = create<CreateTaskFormState>((set) => ({
  ...empty,
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setProjectId: (projectId) => set({ projectId }),
  setAssigneeId: (assigneeId) => set({ assigneeId }),
  reset: () => set(empty),
}));
