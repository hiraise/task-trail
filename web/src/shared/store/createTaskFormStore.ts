import { create } from "zustand";
import { Project, ProjectMember } from "@/domain/project/project.entity";

export interface TaskFormData {
  name: string;
  description: string;
  assignee?: Partial<ProjectMember>;
  project?: Partial<Project>;
}

interface TaskFormActions {
  set: (partialState: Partial<TaskFormData>) => void;
  reset: () => void;
  selectAssignee: (assignee: Partial<ProjectMember>) => void;
  selectProject: (project: Partial<Project>) => void;
}

const initialState: TaskFormData = {
  name: "",
  description: "",
  assignee: undefined,
  project: undefined,
};

export const useCreateTaskFormStore = create<TaskFormData & TaskFormActions>((set, get) => ({
  ...initialState,
  set: (partialState) => set(partialState),
  reset: () => set(initialState),
  selectAssignee: (assignee) => {
    if (get().assignee === assignee) return;
    set({ assignee: assignee });
  },
  selectProject: (project) => {
    if (get().project === project) return;
    set({ project: project });
  },
}));
