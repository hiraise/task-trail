import { create } from "zustand";

import { ProjectCreationDraft } from "@/domain/models/ProjectCreationDraft";

interface CreateProjectFormState {
  draft: ProjectCreationDraft | null;
  initialize: () => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  addParticipant: (email: string) => void;
  removeParticipant: (email: string) => void;
  toggleParticipant: (email: string) => void;
  setParticipants: (emails: string[]) => void;
  reset: () => void;
}

export const useCreateProjectFormStore = create<CreateProjectFormState>((set) => ({
  draft: null,

  initialize: () => {
    set((state) => {
      if (state.draft) return state;

      return { draft: new ProjectCreationDraft() };
    });
  },

  setName: (name: string) => {
    set((state) => {
      if (!state.draft) return state;
      state.draft.setName(name);

      return { draft: state.draft };
    });
  },

  setDescription: (description: string) => {
    set((state) => {
      if (!state.draft) return state;
      state.draft.setDescription(description);

      return { draft: state.draft };
    });
  },

  addParticipant: (email: string) => {
    set((state) => {
      if (!state.draft) return state;
      state.draft.addMemberByEmail(email);

      return { draft: state.draft };
    });
  },

  removeParticipant: (email: string) => {
    set((state) => {
      if (!state.draft) return state;
      state.draft.removeMember(email);

      return { draft: state.draft };
    });
  },

  toggleParticipant: (email: string) => {
    set((state) => {
      if (!state.draft) return state;
      state.draft.toggleMember(email);

      return { draft: state.draft };
    });
  },

  setParticipants: (emails: string[]) => {
    set((state) => {
      if (!state.draft) return state;
      state.draft.setMembers(emails);

      return { draft: state.draft };
    });
  },

  reset: () => {
    set({ draft: null });
  },
}));
