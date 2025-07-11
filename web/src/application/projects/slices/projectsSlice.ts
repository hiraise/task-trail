import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { mockProjects } from "./projects.mocks";
import { Project } from "@/domain/project/project.entity";

type ProjectsState = Project[];

const initialState: ProjectsState = mockProjects;

const projectsSlice = createSlice({
  name: "projects",
  initialState: initialState,
  reducers: {
    setProjects(state, action: PayloadAction<Project[]>) {
      return action.payload;
      // return [...action.payload, ...state];
    },
  },
});

export const { setProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
