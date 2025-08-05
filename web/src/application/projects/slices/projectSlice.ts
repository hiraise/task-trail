import { Project } from "@/domain/project/project.entity";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ProjectState = {
  project: Project | null;
  members: string[];
  tasks: string[];
};

const initialState: ProjectState = {
  project: null,
  members: [],
  tasks: [],
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProject(state, action: PayloadAction<Project>) {
      state.project = action.payload;
    },
    clearProject(state) {
      state.project = null;
      state.members = [];
      state.tasks = [];
    },
    setMembers(state, action) {
      state.members = action.payload;
    },
    setTasks(state, action) {
      state.tasks = action.payload;
    },
  },
});

export const { setProject, clearProject, setMembers, setTasks } =
  projectSlice.actions;
export default projectSlice.reducer;
