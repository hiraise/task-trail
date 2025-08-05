import { createAsyncThunk } from "@reduxjs/toolkit";

import { EditProject } from "@/domain/project/project.contracts";
import { AppErrorProps } from "@/shared/errors/types";
import { RootState } from "@/infrastructure/redux/store";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { EditProjectPayload } from "@/domain/project/project.payload";
import { getProjectByIdThunk } from "./projectsThunks";

export const createEditProjectThunk = (editProject: EditProject) =>
  createAsyncThunk<
    void,
    { id: number; payload: EditProjectPayload },
    { rejectValue: AppErrorProps; state: RootState }
  >(
    "projects/editProject",
    async ({ id, payload }, { dispatch, rejectWithValue }) => {
      try {
        await editProject(id, payload);
        await dispatch(getProjectByIdThunk(id));
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
