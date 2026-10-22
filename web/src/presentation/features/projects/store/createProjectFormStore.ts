import { create } from "zustand";

// Draft of a new project. Modals open as a stack and only the top one is shown: while the member
// picker is open, the project form is unmounted, so its fields live here rather than in the
// form state. The draft is cleared after the project is created.

interface CreateProjectFormState {
  name: string;
  description: string;
  key: string;
  /** The user typed the key: it no longer follows the name */
  keyEdited: boolean;
  emails: string[];
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setKey: (key: string, edited: boolean) => void;
  setEmails: (emails: string[]) => void;
  removeEmail: (email: string) => void;
  reset: () => void;
}

const empty = { name: "", description: "", key: "", keyEdited: false, emails: [] };

export const useCreateProjectFormStore = create<CreateProjectFormState>((set) => ({
  ...empty,
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setKey: (key, keyEdited) => set({ key, keyEdited }),
  setEmails: (emails) => set({ emails }),
  removeEmail: (email) => set((state) => ({ emails: state.emails.filter((e) => e !== email) })),
  reset: () => set(empty),
}));
