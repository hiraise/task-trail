import { BaseStore, createStore } from "./baseStore";

export interface TaskFormData {
  name: string;
  description: string;
  assigneeId?: number;
  projectId: number;
}

const initialState: TaskFormData = {
  name: "",
  description: "",
  assigneeId: undefined,
  projectId: 0,
};

function extraMethods(store: BaseStore<TaskFormData>) {
  const selectAssignee = (assigneeId: number) => {
    if (store.data.assigneeId === assigneeId) return;
    store.set({ assigneeId: assigneeId });
  };

  const selectProject = (projectId: number) => {
    if (store.data.projectId === projectId) return;
    store.set({ projectId: projectId });
  };
  return { selectAssignee, selectProject };
}

export const createTaskFormStore = createStore(initialState, extraMethods);
