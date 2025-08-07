import { createAsyncThunk } from "@reduxjs/toolkit";

import { AddMembers } from "@/domain/project/project.contracts";
import { AppErrorProps } from "@/shared/errors/types";
import { handleThunkError } from "@/shared/utils/handleThunkError";

export const createAddMembersThunk = (addMembers: AddMembers) =>
  createAsyncThunk<
    void,
    { emails: string[]; id: number },
    { rejectValue: AppErrorProps }
  >("projects/addMembers", async ({ emails, id }, { rejectWithValue }) => {
    try {
      return await addMembers(emails, id);
    } catch (error) {
      return handleThunkError(error, rejectWithValue);
    }
  });
