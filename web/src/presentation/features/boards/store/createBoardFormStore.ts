import { create } from "zustand";

import type { User } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";

// Draft of a new board. Modals open as a stack and only the top one is shown: while the project or
// member picker is open, the board form is unmounted, so its fields live here rather than in the
// form state. The draft is cleared after the board is created.

interface CreateBoardFormState {
  name: string;
  projectIds: ProjectId[];
  members: User[];
  setName: (name: string) => void;
  setProjectIds: (projectIds: ProjectId[]) => void;
  setMembers: (members: User[]) => void;
  removeMemberByEmail: (email: string) => void;
  reset: () => void;
}

const empty = { name: "", projectIds: [], members: [] };

export const useCreateBoardFormStore = create<CreateBoardFormState>((set) => ({
  ...empty,
  setName: (name) => set({ name }),
  setProjectIds: (projectIds) => set({ projectIds }),
  setMembers: (members) => set({ members }),
  removeMemberByEmail: (email) =>
    set((state) => ({ members: state.members.filter((member) => member.email !== email) })),
  reset: () => set(empty),
}));
