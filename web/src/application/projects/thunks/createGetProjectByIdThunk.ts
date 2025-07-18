import { AppErrorProps } from "@/shared/errors/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { GetProjectById } from "@/domain/project/project.contracts";
import { RootState } from "@/infrastructure/redux/store";
import { Project } from "@/domain/project/project.entity";
import { setProject } from "../slices/projectSlice";

export const createGetProjectByIdThunk = (getProjectById: GetProjectById) =>
  createAsyncThunk<
    Project,
    number,
    { rejectValue: AppErrorProps; state: RootState }
  >(
    "projects/getProject",
    async (id: number, { dispatch, getState, rejectWithValue }) => {
      try {
        const state = getState();
        const existingProjectInList = state.projects.find(
          (project) => project.id === id
        );
        const currentProject = state.project.project;
        const isCurrentProject = currentProject?.id === id;

        if (existingProjectInList && isCurrentProject) {
          return existingProjectInList;
        }
        const project = await getProjectById(id);

        if (!project) {
          throw new Error(`Project with id ${id} not found`);
        }
        dispatch(setProject(project));
        return project;
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
