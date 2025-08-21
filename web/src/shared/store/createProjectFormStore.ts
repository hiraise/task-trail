import { BaseStore, createStore } from "./baseStore";

export interface ProjectFormData {
  name: string;
  description: string;
  participants: string[];
}

const initialState: ProjectFormData = {
  name: "",
  description: "",
  participants: [],
};

function extraMethods(store: BaseStore<ProjectFormData>) {
  const addParticipant = (email: string) => {
    if (!store.data.participants.includes(email)) {
      store.set({ participants: [...store.data.participants, email] });
    }
  };

  const toggleParticipant = (email: string) => {
    const participants = store.data.participants;
    if (participants.includes(email)) {
      store.set({ participants: participants.filter((p) => p !== email) });
    } else {
      store.set({ participants: [...participants, email] });
    }
  };
  return { addParticipant, toggleParticipant };
}

export const createProjectFormStore = createStore(initialState, extraMethods);
