import { GetProjects } from "@/domain/project/project.contracts";
import { AppErrorProps } from "@/shared/errors/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setProjects } from "../slices/projectsSlice";
import { handleThunkError } from "@/shared/utils/handleThunkError";

export const createGetProjectsThunk = (getProjects: GetProjects) =>
  createAsyncThunk<void, void, { rejectValue: AppErrorProps }>(
    "projects/getProjects",
    async (_, { dispatch, rejectWithValue }) => {
      try {
        const projects = await getProjects();
        dispatch(setProjects(projects));
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
