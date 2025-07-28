import { createAsyncThunk } from "@reduxjs/toolkit";

import { GetProjectCandidates } from "@/domain/project/project.contracts";
import { AppErrorProps } from "@/shared/errors/types";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { User } from "@/domain/user/user.entity";

export const createGetProjectCandidatesThunk = (
  getProjectCandidates: GetProjectCandidates
) =>
  createAsyncThunk<User[], number | undefined, { rejectValue: AppErrorProps }>(
    "projects/getProjectCandidates",
    async (projectId, { dispatch, rejectWithValue }) => {
      try {
        const candidates = await getProjectCandidates(projectId);
        return candidates;
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
