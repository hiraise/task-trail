import { create } from "zustand";

export interface ProjectFormData {
  name: string;
  description: string;
  participants: string[];
}

interface ProjectFormActions {
  set: (partialState: Partial<ProjectFormData>) => void;
  reset: () => void;
  addParticipant: (email: string) => void;
  toggleParticipant: (email: string) => void;
}

const initialState: ProjectFormData = {
  name: "",
  description: "",
  participants: [],
};

export const useCreateProjectFormStore = create<ProjectFormData & ProjectFormActions>(
  (set, get) => ({
    ...initialState,
    set: (partialState) => set(partialState),
    reset: () => set(initialState),
    addParticipant: (email: string) => {
      if (!get().participants.includes(email)) {
        set({ participants: [...get().participants, email] });
      }
    },
    toggleParticipant: (email: string) => {
      const participants = get().participants;
      if (participants.includes(email)) {
        set({ participants: participants.filter((p) => p !== email) });
      } else {
        set({ participants: [...participants, email] });
      }
    },
  })
);
