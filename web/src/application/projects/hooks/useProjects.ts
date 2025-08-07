import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import {
  addMembersThunk,
  editProjectThunk,
  getMembersThunk,
  getProjectByIdThunk,
  getProjectCandidatesThunk,
  getProjectsThunk,
  newProjectThunk,
} from "../thunks/projectsThunks";
import { ProjectPayload } from "@/domain/project/project.payload";
import { Project } from "@/domain/project/project.entity";
import { ROUTES } from "@/infrastructure/config/routes";
import { clearProject } from "../slices/projectSlice";
import { User } from "@/domain/user/user.entity";
import { EditProject } from "@/domain/project/project.contracts";

//TODO: Replace try/catch with status handling in thunks

type UseProjectsResult = {
  createProject: (payload: ProjectPayload) => Promise<Project | undefined>;
  getProjects: () => Promise<void>;
  getCandidates: (projectId?: number) => Promise<User[] | undefined>;
  getProjectById: (id: number) => Promise<void>;
  clearCurrentProject: () => void;
  editProject: EditProject;
  getMembers: (id: number) => Promise<void>;
  addMembers: (id: number, emails: string[]) => Promise<void>;
  isLoading: boolean;
  projects: Project[];
};

export const useProjects = (): UseProjectsResult => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const projects = useAppSelector((s) => s.projects);
  const [isLoading, setIsLoading] = useState(false);

  const getProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(getProjectsThunk()).unwrap();
    } catch (error) {
      clientLogger.error("useProjects error:", { error });
      toast.error("Failed to load projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const createProject = async (payload: ProjectPayload) => {
    setIsLoading(true);
    try {
      const project = await dispatch(newProjectThunk(payload)).unwrap();
      if (project) router.push(ROUTES.project(project.id.toString()));
      toast.success("Project created successfully");
      return project;
    } catch (error) {
      clientLogger.error("useProjects createProject error:", { error });
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCandidates = useCallback(
    async (projectId?: number) => {
      setIsLoading(true);
      try {
        return await dispatch(getProjectCandidatesThunk(projectId)).unwrap();
      } catch (error) {
        clientLogger.error("useProjects getCandidates error:", { error });
        toast.error("Failed to load project candidates. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  const getProjectById = useCallback(
    async (id: number) => {
      setIsLoading(true);
      try {
        await dispatch(getProjectByIdThunk(id)).unwrap();
      } catch (error) {
        clientLogger.error("useProjects getProjectById error:", { error });
        toast.error("Failed to load project. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  const clearCurrentProject = useCallback(() => {
    dispatch(clearProject());
  }, [dispatch]);

  const editProject: EditProject = useCallback(
    async (id, payload) => {
      setIsLoading(true);
      try {
        await dispatch(editProjectThunk({ id, payload })).unwrap();
        toast.success("Project updated successfully");
      } catch (error) {
        clientLogger.error("useProjects editProject error:", { error });
        toast.error("Failed to edit project. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  const getMembers = useCallback(
    async (id: number) => {
      setIsLoading(true);
      try {
        await dispatch(getMembersThunk(id)).unwrap();
      } catch (error) {
        clientLogger.error("useProjects getMembers error:", { error });
        toast.error("Failed to load project members. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  const addMembers = async (id: number, emails: string[]) => {
    setIsLoading(true);
    try {
      await dispatch(addMembersThunk({ emails, id })).unwrap();
      await dispatch(getMembersThunk(id)).unwrap();
    } catch (error) {
      clientLogger.error("useProjects addMembers error:", { error });
      toast.error("Failed to add members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProject,
    getProjects,
    getCandidates,
    getProjectById,
    clearCurrentProject,
    editProject,
    getMembers,
    addMembers,
    isLoading,
    projects,
  };
};
