import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import {
  getProjectByIdThunk,
  getProjectsThunk,
  newProjectThunk,
} from "../thunks/projectsThunks";
import { ProjectPayload } from "@/domain/project/project.payload";
import { Project } from "@/domain/project/project.entity";
import { ROUTES } from "@/infrastructure/config/routes";
import { clearProject } from "../slices/projectSlice";

type UseProjectsResult = {
  createProject: (payload: ProjectPayload) => Promise<Project | undefined>;
  getProjects: () => Promise<void>;
  getProjectById: (id: string) => Promise<void>;
  clearCurrentProject: () => void;
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
      if (project) router.push(ROUTES.project(project.id));
      toast.success("Project created successfully");
      return project;
    } catch (error) {
      clientLogger.error("useProjects createProject error:", { error });
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectById = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await dispatch(getProjectByIdThunk(id)).unwrap();
        toast.success("Project loaded successfully");
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

  return {
    createProject,
    getProjects,
    getProjectById,
    clearCurrentProject,
    isLoading,
    projects,
  };
};
