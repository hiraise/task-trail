import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project } from "@/domain/project/project.entity";

type ProjectsState = Project[];

const initialState: ProjectsState = [];

const projectsSlice = createSlice({
  name: "projects",
  initialState: initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Project[]>) {
      return action.payload;
    },
  },
});

export const { setProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
