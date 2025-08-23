import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project, ProjectMember } from "@/domain/project/project.entity";
import projectsApi from "@/infrastructure/adapters/projectsApi";
import { Task } from "@/domain/task/task.entity";

type ProjectState = {
  project: Project | null;
  members: ProjectMember[];
  tasks: Task[];
  isLoading: boolean;
};

const initialState: ProjectState = {
  project: null,
  members: [],
  tasks: [],
  isLoading: false,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProject(state, action: PayloadAction<Project>) {
      state.project = action.payload;
      state.isLoading = false;
    },
    clearProject(state) {
      state.project = null;
      state.members = [];
      state.tasks = [];
      state.isLoading = false;
    },
    setMembers(state, action: PayloadAction<ProjectMember[]>) {
      state.members = action.payload;
    },
    setTasks(state, action) {
      state.tasks = action.payload;
    },
    kickAction(state, action: PayloadAction<{ memberId: number }>) {
      state.members = state.members.filter((member) => member.id !== action.payload.memberId);
    },
  },
  // RTKQ integration
  extraReducers: (builder) => {
    builder
      // Get project by ID
      .addMatcher(projectsApi.endpoints.getById.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(projectsApi.endpoints.getById.matchFulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) state.project = action.payload;
      })
      .addMatcher(projectsApi.endpoints.getById.matchRejected, (state) => {
        state.isLoading = false;
      })
      // Get members
      .addMatcher(projectsApi.endpoints.getMembers.matchFulfilled, (state, action) => {
        state.members = action.payload;
      })
      // Kick member
      .addMatcher(projectsApi.endpoints.kickMember.matchFulfilled, (state, action) => {
        const { memberId } = action.meta.arg.originalArgs;
        state.members = state.members.filter((member) => member.id !== memberId);
      });
  },
});

export const { setProject, clearProject, setMembers, kickAction, setTasks } = projectSlice.actions;
export default projectSlice.reducer;
