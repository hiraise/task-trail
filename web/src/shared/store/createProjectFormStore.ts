import type { BaseStore } from "./baseStore";

export interface ProjectFormData {
  name: string;
  description: string;
  participants: string[];
}

interface CreateProjectFormStore extends BaseStore<ProjectFormData> {
  addParticipant: (email: string) => void;
  toggleParticipant: (email: string) => void;
}

const initialState: ProjectFormData = {
  name: "",
  description: "",
  participants: [],
};

export const createProjectFormStore: CreateProjectFormStore = {
  data: { ...initialState },
  listeners: new Set(),

  get: () => createProjectFormStore.data,

  set: (partialData: Partial<ProjectFormData>) => {
    createProjectFormStore.data = { ...createProjectFormStore.data, ...partialData };
    for (const listener of createProjectFormStore.listeners) {
      try {
        listener(createProjectFormStore.data);
      } catch (error) {
        console.error("Error in listener:", error);
      }
    }
  },

  subscribe: (listener: (value: ProjectFormData) => void) => {
    createProjectFormStore.listeners.add(listener);
    return () => {
      createProjectFormStore.listeners.delete(listener);
    };
  },

  addParticipant: (email: string) => {
    const currentParticipants = createProjectFormStore.data.participants;
    if (!currentParticipants.includes(email)) {
      createProjectFormStore.set({ participants: [...currentParticipants, email] });
    }
  },

  toggleParticipant: (email: string) => {
    const currentParticipants = createProjectFormStore.data.participants;
    if (currentParticipants.includes(email)) {
      createProjectFormStore.set({
        participants: currentParticipants.filter((participant) => participant !== email),
      });
    } else {
      createProjectFormStore.set({ participants: [...currentParticipants, email] });
    }
  },

  reset: () => {
    createProjectFormStore.data = { ...initialState };
    for (const listener of createProjectFormStore.listeners) {
      try {
        listener(createProjectFormStore.data);
      } catch (error) {
        console.error("Error in listener:", error);
      }
    }
  },
};
