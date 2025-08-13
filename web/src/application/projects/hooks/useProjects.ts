import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import {
  addMembersThunk,
  editProjectThunk,
  getProjectByIdThunk,
  getProjectCandidatesThunk,
  getProjectsThunk,
  newProjectThunk,
} from "../thunks/projectsThunks";
import { ProjectPayload } from "@/domain/project/project.payload";
import { Project } from "@/domain/project/project.entity";
import { ROUTES } from "@/infrastructure/config/routes";
import { clearProject, kickAction, setMembers } from "../slices/projectSlice";
import { User } from "@/domain/user/user.entity";
import { EditProject } from "@/domain/project/project.contracts";
import * as api from "@/infrastructure/adapters/projectsApi";
import { removeById } from "../slices/projectsSlice";

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
  deleteById: (id: number) => Promise<void>;
  kick: (projectId: number, memberId: number) => Promise<void>;
  leave: (id: number) => Promise<void>;
  isLoading: boolean;
  projects: Project[];
};

export const useProjects = (): UseProjectsResult => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const projects = useAppSelector((s) => s.projects);
  const [isLoading, setIsLoading] = useState(false);

  // Define hooks for API interactions
  const [triggerGetMembers] = api.useLazyGetMembersQuery();
  const [kick] = api.useKickMemberMutation();
  const [leave] = api.useLeaveMutation();
  const [deleteProject] = api.useDeleteMutation();

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
      try {
        await dispatch(getProjectByIdThunk(id)).unwrap();
      } catch (error) {
        clientLogger.error("useProjects getProjectById error:", { error });
        toast.error("Failed to load project. Please try again.");
      }
    },
    [dispatch]
  );

  /**
   * Clears the current project from the state.
   * @returns {void}
   */
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

  /**
   * Loads project members by project ID and updates the members state.
   * @param {number} id - Project ID
   * @returns {Promise<void>} - Promise that resolves after members are loaded
   */
  const getMembers = useCallback(
    async (id: number) => {
      setIsLoading(true);
      try {
        const result = await triggerGetMembers(id);
        dispatch(setMembers(result.data ?? []));
      } catch (error) {
        clientLogger.error("useProjects getMembers error:", { error });
        toast.error("Failed to load project members. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [triggerGetMembers, dispatch]
  );

  const addMembers = async (id: number, emails: string[]) => {
    setIsLoading(true);
    try {
      await dispatch(addMembersThunk({ emails, id })).unwrap();
      const result = await triggerGetMembers(id);
      dispatch(setMembers(result.data ?? []));
    } catch (error) {
      clientLogger.error("useProjects addMembers error:", { error });
      toast.error("Failed to add members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Deletes a project by its ID.
   * Navigates to the projects list after successful deletion and shows a success message.
   * Displays an error toast if the deletion fails.
   * @param {number} id - The ID of the project to delete
   * @returns {Promise<void>} - Promise that resolves after the project is deleted
   */
  const deleteById = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteProject(id).unwrap();
      dispatch(removeById(id));
      router.replace(ROUTES.projects);
      toast.success("Project deleted successfully");
    } catch (error) {
      clientLogger.error("useProjects deleteProjectById error:", { error });
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Removes a member from the project by their ID.
   * @param {number} projectId - The ID of the project
   * @param {number} memberId - The ID of the member to be removed
   * @returns {Promise<void>} - Promise that resolves after the member is removed
   */
  const kickMember = async (projectId: number, memberId: number) => {
    setIsLoading(true);
    try {
      await kick({ projectId, memberId }).unwrap();
      dispatch(kickAction({ memberId }));
      toast.success("Member kicked successfully");
    } catch (error) {
      clientLogger.error("useProjects kickMember error:", { error });
      toast.error("Failed to kick member. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Allows the current user to leave the project by its ID.
   * @param {number} id - The ID of the project to leave
   * @returns {Promise<void>} - Promise that resolves after the user leaves the project
   */
  const leaveProject = async (id: number) => {
    setIsLoading(true);
    try {
      await leave({ projectId: id }).unwrap();
      router.replace(ROUTES.projects);
      toast.success("You have left the project");
    } catch (error) {
      clientLogger.error("useProjects leaveProject error:", { error });
      toast.error("Failed to leave project. Please try again.");
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
    deleteById,
    kick: kickMember,
    leave: leaveProject,
    isLoading,
    projects,
  };
};
