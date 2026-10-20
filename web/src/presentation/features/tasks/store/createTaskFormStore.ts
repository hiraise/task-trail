import { create } from "zustand";

import { selectProjectForTaskUseCase } from "@/application/usecases";
import type { Project } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import { TaskCreationDraft } from "@/domain/models/TaskCreationDraft";
import type { ProjectId, UserId } from "@/domain/types";
import { logger } from "@/infrastructure/config/clientLogger";

export interface ProjectData {
  id: ProjectId;
  name: string;
}

export interface AssigneeData {
  id: UserId;
  name: string;
  email: string;
}

interface CreateTaskFormState {
  draft: TaskCreationDraft | null;
  project: ProjectData | null;
  assignee: AssigneeData | null;
  initialize: () => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setAssignee: (projectMember: ProjectMember | null) => void;
  setProject: (project: Project) => Promise<void>;
  reset: () => void;
}

export const useCreateTaskFormStore = create<CreateTaskFormState>((set, get) => ({
  draft: null,
  project: null,
  assignee: null,

  initialize: () => {
    set((state) => {
      if (state.draft) return state;

      return { draft: new TaskCreationDraft() };
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

  setAssignee: (projectMember: ProjectMember | null) => {
    set((state) => {
      if (!state.draft || !projectMember) return state;
      const data: AssigneeData = {
        id: projectMember.id,
        name: projectMember.username,
        email: projectMember.email,
      };

      state.draft.setAssigneeId(data.id);

      return { draft: state.draft, assignee: data };
    });
  },

  setProject: async (project: Project) => {
    const state = get();

    if (!state.draft) return;

    try {
      const result = await selectProjectForTaskUseCase(
        state.draft,
        project.id,
        state.assignee?.id || null,
      );

      set({
        draft: state.draft,
        project: {
          id: project.id,
          name: project.name,
        },
        assignee: result.assigneeCleared ? null : state.assignee,
      });

      logger.info("Project selected for task", {
        projectId: project.id,
        assigneeCleared: result.assigneeCleared,
      });
    } catch (error) {
      logger.error("Failed to select project for task", { error, projectId: project.id });
      throw error;
    }
  },

  reset: () => set({ draft: null }),
}));
