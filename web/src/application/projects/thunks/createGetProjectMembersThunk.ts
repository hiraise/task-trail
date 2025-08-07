import { createAsyncThunk } from "@reduxjs/toolkit";

import { GetMembers } from "@/domain/project/project.contracts";
import { AppErrorProps } from "@/shared/errors/types";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { setMembers } from "../slices/projectSlice";

export const createGetProjectMembersThunk = (getMembers: GetMembers) =>
  createAsyncThunk<void, number, { rejectValue: AppErrorProps }>(
    "projects/getProjectMembers",
    async (id, { dispatch, rejectWithValue }) => {
      try {
        const members = await getMembers(id);
        dispatch(setMembers(members));
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
