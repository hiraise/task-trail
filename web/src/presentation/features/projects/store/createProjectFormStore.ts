import { create } from "zustand";

// Черновик нового проекта. Окна открываются стеком и показывается только верхнее: пока открыто
// окно выбора участников, форма проекта размонтирована, поэтому её поля живут здесь, а не
// в состоянии формы. Черновик стирается после создания проекта.

interface CreateProjectFormState {
  name: string;
  description: string;
  emails: string[];
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setEmails: (emails: string[]) => void;
  removeEmail: (email: string) => void;
  reset: () => void;
}

const empty = { name: "", description: "", emails: [] };

export const useCreateProjectFormStore = create<CreateProjectFormState>((set) => ({
  ...empty,
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setEmails: (emails) => set({ emails }),
  removeEmail: (email) => set((state) => ({ emails: state.emails.filter((e) => e !== email) })),
  reset: () => set(empty),
}));
