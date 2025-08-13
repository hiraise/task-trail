import { Project, ProjectMember } from "@/domain/project/project.entity";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getProjectByIdThunk } from "../thunks/projectsThunks";

type ProjectState = {
  project: Project | null;
  members: ProjectMember[];
  tasks: string[];
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
  // Get project by ID
  extraReducers: (builder) => {
    builder
      .addCase(getProjectByIdThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProjectByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.project = action.payload;
      });
  },
});

export const { setProject, clearProject, setMembers, kickAction, setTasks } = projectSlice.actions;
export default projectSlice.reducer;
