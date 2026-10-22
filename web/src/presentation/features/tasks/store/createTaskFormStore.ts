import { create } from "zustand";

import type { ProjectId, UserId } from "@/domain/types";

// Черновик новой задачи. Окна открываются стеком и показывается только верхнее: пока открыто
// окно выбора проекта или ответственного, форма задачи размонтирована, поэтому её поля живут
// здесь, а не в состоянии формы. Черновик стирается после создания задачи.

interface CreateTaskFormState {
  name: string;
  description: string;
  projectId?: ProjectId;
  /** Ответственный — участник выбранного проекта; не участник — форма его не показывает */
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
