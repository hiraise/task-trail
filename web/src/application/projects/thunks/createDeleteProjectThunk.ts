import { createAsyncThunk } from "@reduxjs/toolkit";

import { DeleteProject } from "@/domain/project/project.contracts";
import { RootState } from "@/infrastructure/redux/store";
import { AppErrorProps } from "@/shared/errors/types";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { deleteProjectById } from "../slices/projectsSlice";

export const createDeleteProjectThunk = (deleteProject: DeleteProject) =>
  createAsyncThunk<void, number, { rejectValue: AppErrorProps; state: RootState }>(
    "project/deleteProject",
    async (projectId, { dispatch, rejectWithValue }) => {
      try {
        await deleteProject(projectId);
        dispatch(deleteProjectById(projectId));
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
