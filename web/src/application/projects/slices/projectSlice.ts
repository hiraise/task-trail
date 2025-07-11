import { Project } from "@/domain/project/project.entity";
import { createSlice } from "@reduxjs/toolkit";

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
    setProject(state, action) {
      state.project = action.payload;
    },
    setMembers(state, action) {
      state.members = action.payload;
    },
    setTasks(state, action) {
      state.tasks = action.payload;
    },
  },
});

export const { setProject, setMembers, setTasks } = projectSlice.actions;
export default projectSlice.reducer;
