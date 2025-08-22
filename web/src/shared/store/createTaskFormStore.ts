import { BaseStore, createStore } from "./baseStore";
import { Project, ProjectMember } from "@/domain/project/project.entity";

export interface TaskFormData {
  name: string;
  description: string;
  assignee?: Partial<ProjectMember>;
  project?: Partial<Project>;
}

const initialState: TaskFormData = {
  name: "",
  description: "",
  assignee: undefined,
  project: undefined,
};

function extraMethods(store: BaseStore<TaskFormData>) {
  const selectAssignee = (assignee: Partial<ProjectMember>) => {
    if (store.data.assignee === assignee) return;
    store.set({ assignee: assignee });
  };

  const selectProject = (project: Partial<Project>) => {
    if (store.data.project === project) return;
    store.set({ project: project });
  };
  return { selectAssignee, selectProject };
}

export const createTaskFormStore = createStore(initialState, extraMethods);
