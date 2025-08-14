import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Project } from "@/domain/project/project.entity";
import projectsApi from "@/infrastructure/adapters/projectsApi";

type ProjectsState = Project[];

const initialState: ProjectsState = [];

const projectsSlice = createSlice({
  name: "projects",
  initialState: initialState,
  reducers: {
    removeById(state, action: PayloadAction<number>) {
      const projectId = action.payload;
      return state.filter((project) => project.id !== projectId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Get projects
      .addMatcher(
        projectsApi.endpoints.get.matchFulfilled,
        (state, action: PayloadAction<Project[]>) => {
          return action.payload || [];
        }
      );
  },
});

export const { removeById } = projectsSlice.actions;
export default projectsSlice.reducer;
