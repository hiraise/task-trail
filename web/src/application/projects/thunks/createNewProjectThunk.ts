import { NewProject } from "@/domain/project/project.contracts";
import { Project } from "@/domain/project/project.entity";
import { ProjectPayload } from "@/domain/project/project.payload";
import { AppErrorProps } from "@/shared/errors/types";
import { handleThunkError } from "@/shared/utils/handleThunkError";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setProject } from "../slices/projectSlice";
import { getProjectsThunk } from "./projectsThunks";

export const createNewProjectThunk = (newProject: NewProject) =>
  createAsyncThunk<Project, ProjectPayload, { rejectValue: AppErrorProps }>(
    "projects/newProject",
    async (payload, { dispatch, rejectWithValue }) => {
      try {
        const p = await newProject(payload);
        const project: Project = {
          id: p.id,
          ...payload,
          totalTasks: p.totalTasks,
        };
        dispatch(setProject(project));
        await dispatch(getProjectsThunk()).unwrap();
        return project;
      } catch (error) {
        return handleThunkError(error, rejectWithValue);
      }
    }
  );
