import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { ProjectPayload } from "@/domain/project/project.payload";
import { ROUTES } from "@/infrastructure/config/routes";
import { clearProject, kickAction, setMembers } from "../slices/projectSlice";
import { EditProject } from "@/domain/project/project.contracts";
import { removeById } from "../slices/projectsSlice";
import * as api from "@/infrastructure/adapters/projectsApi";

export const useProjects = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const projects = useAppSelector((s) => s.projects);
  const [isLoading, setIsLoading] = useState(false);

  // Define hooks for API interactions
  const [triggerGetMembers] = api.useLazyGetMembersQuery();
  const [triggerGetProjectById] = api.useLazyGetByIdQuery();
  const [kickMemberMutation] = api.useKickMemberMutation();
  const [leaveMutation] = api.useLeaveMutation();
  const [deleteMutation] = api.useDeleteMutation();
  const [editMutation] = api.useEditMutation();
  const [triggerGet] = api.useLazyGetQuery();
  const [addMembersMutation] = api.useAddMembersMutation();
  const [triggerGetCandidates] = api.useLazyGetCandidatesQuery();
  const [createMutation] = api.useCreateMutation();

  /**
   * Loads the list of projects from the API and updates the state.
   * Displays an error toast if the request fails.
   * Sets the loading state while the request is in progress.
   *
   * @returns {Promise<void>} Promise that resolves when projects are loaded.
   */
  const get = useCallback(async () => {
    setIsLoading(true);
    try {
      await triggerGet().unwrap();
    } catch (error) {
      clientLogger.error("useProjects error:", { error });
      toast.error("Failed to load projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [triggerGet]);

  /**
   * Creates a new project and navigates to its page on success.
   *
   * @param {ProjectPayload} payload - Project data.
   * @returns {Promise<Project | undefined>} Newly created project or undefined if failed.
   */
  const create = async (payload: ProjectPayload) => {
    setIsLoading(true);
    try {
      const project = await createMutation(payload).unwrap();
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
        return await triggerGetCandidates(projectId).unwrap();
      } catch (error) {
        clientLogger.error("useProjects getCandidates error:", { error });
        toast.error("Failed to load project candidates. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [triggerGetCandidates]
  );

  const getById = useCallback(
    async (id: number) => {
      try {
        await triggerGetProjectById(id);
      } catch (error) {
        clientLogger.error("useProjects getProjectById error:", { error });
        toast.error("Failed to load project. Please try again.");
      }
    },
    [triggerGetProjectById]
  );

  /**
   * Clears the current project from the state.
   * @returns {void}
   */
  const clearCurrent = useCallback(() => {
    dispatch(clearProject());
  }, [dispatch]);

  /**
   * Updates a project by ID.
   * @param {number} id Project ID
   * @param {ProjectPayload} payload Updated project data of type
   * @returns {Promise<void>} that resolves when update is complete
   */
  const edit: EditProject = useCallback(
    async (id, payload) => {
      setIsLoading(true);
      try {
        await editMutation({ id, payload }).unwrap();
        await triggerGet().unwrap();
        toast.success("Project updated successfully");
      } catch (error) {
        clientLogger.error("useProjects editProject error:", { error });
        toast.error("Failed to edit project. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [editMutation, triggerGet]
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
      await addMembersMutation({ emails, id }).unwrap();
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
      await deleteMutation(id).unwrap();
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
  const kick = async (projectId: number, memberId: number) => {
    setIsLoading(true);
    try {
      await kickMemberMutation({ projectId, memberId }).unwrap();
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
  const leave = async (id: number) => {
    setIsLoading(true);
    try {
      await leaveMutation({ projectId: id }).unwrap();
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
    create,
    get,
    getCandidates,
    getById,
    clearCurrent,
    edit,
    getMembers,
    addMembers,
    deleteById,
    kick,
    leave,
    isLoading,
    projects,
  };
};
