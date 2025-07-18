import { AddMembers, NewProject } from "@/domain/project/project.contracts";
import { Project } from "@/domain/project/project.entity";
import { ProjectPayload } from "@/domain/project/project.payload";
import { AppErrorProps } from "@/shared/errors/types";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setMembers, setProject } from "../slices/projectSlice";

export const createNewProjectThunk = (
  newProject: NewProject,
  addMembers: AddMembers
) =>
  createAsyncThunk<Project, ProjectPayload, { rejectValue: AppErrorProps }>(
    "projects/newProject",
    async (payload, { dispatch, rejectWithValue }) => {
      try {
        const project = await newProject(payload);
        dispatch(setProject(project));
        if (payload.participants && payload.participants.length > 0) {
          await addMembers(project.id, payload.participants);
          dispatch(setMembers(payload.participants));
        }
        return project;
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
