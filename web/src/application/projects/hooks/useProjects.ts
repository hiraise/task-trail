import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { ProjectPayload } from "@/domain/project/project.payload";
import { ROUTES } from "@/infrastructure/config/routes";
import { clearProject, kickAction, setMembers } from "../slices/projectSlice";
import { EditProject } from "@/domain/project/project.contracts";
import { removeById } from "../slices/projectsSlice";
import * as api from "@/infrastructure/adapters/projectsApi";
import { handleAsyncAction } from "@/shared/utils/handleAsyncAction";
import { Project } from "@/domain/project/project.entity";

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
  const get = useCallback(
    async () =>
      handleAsyncAction({
        action: async () => await triggerGet().unwrap(),
        setIsLoading,
        errorMessage: "Failed to load projects. Please try again.",
      }),
    [triggerGet]
  );

  /**
   * Creates a new project and navigates to its page on success.
   *
   * @param {ProjectPayload} payload - Project data.
   * @returns {Promise<Project | undefined>} Newly created project or undefined if failed.
   */
  const create = async (payload: ProjectPayload): Promise<Project | undefined> =>
    handleAsyncAction<Project>({
      action: async () => {
        const project = await createMutation(payload).unwrap();
        if (project) router.push(ROUTES.project(project.id.toString()));
        toast.success("Project created successfully");
        return project;
      },
      setIsLoading,
      errorMessage: "Failed to create project. Please try again",
    });

  /**
   * Loads candidates for a project by its ID from the API.
   * Displays an error toast if the request fails.
   * Sets the loading state while the request is in progress.
   *
   * @param {number} [projectId] - The ID of the project to load candidates for (optional)
   * @returns {Promise<any>} - Promise that resolves with the candidates or null if failed
   */
  const getCandidates = useCallback(
    async (projectId?: number) =>
      handleAsyncAction({
        action: async () => await triggerGetCandidates(projectId).unwrap(),
        setIsLoading,
        errorMessage: "Failed to load project candidates. Please try again.",
      }),
    [triggerGetCandidates]
  );

  /**
   * Loads a project by its ID from the API.
   * Displays an error toast if the request fails.
   * Sets the loading state while the request is in progress.
   *
   * @param {number} id - The ID of the project to load
   * @returns {Promise<Project | null>} - Promise that resolves with the project or null if failed
   */
  const getById = useCallback(
    async (id: number) =>
      handleAsyncAction({
        action: async () => await triggerGetProjectById(id).unwrap(),
        setIsLoading,
        errorMessage: "Failed to load project. Please try again.",
      }),
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
    async (id, payload) =>
      handleAsyncAction({
        action: async () => {
          await editMutation({ id, payload }).unwrap();
          await triggerGet().unwrap();
          toast.success("Project updated successfully");
        },
        setIsLoading,
        errorMessage: "Failed to edit project. Please try again.",
      }),
    [editMutation, triggerGet]
  );

  /**
   * Loads project members by project ID and updates the members state.
   * @param {number} id - Project ID
   * @returns {Promise<void>} - Promise that resolves after members are loaded
   */
  const getMembers = useCallback(
    async (id: number) =>
      handleAsyncAction({
        action: async () => {
          const result = await triggerGetMembers(id);
          dispatch(setMembers(result.data ?? []));
        },
        setIsLoading,
        errorMessage: "Failed to load project members. Please try again.",
      }),
    [triggerGetMembers, dispatch]
  );

  /**
   * Adds new members to a project by their email addresses.
   * After successfully adding members, refreshes the project members list.
   * Displays an error toast if the addition fails.
   * @param {number} id - The ID of the project to add members to
   * @param {string[]} emails - Array of email addresses of users to be added as members
   * @returns {Promise<void>} - Promise that resolves after members are added and the members list is refreshed
   */
  const addMembers = async (id: number, emails: string[]) =>
    handleAsyncAction({
      action: async () => {
        await addMembersMutation({ emails, id }).unwrap();
        const result = await triggerGetMembers(id);
        dispatch(setMembers(result.data ?? []));
      },
      setIsLoading,
      errorMessage: "Failed to add members. Please try again.",
    });

  /**
   * Deletes a project by its ID.
   * Navigates to the projects list after successful deletion and shows a success message.
   * Displays an error toast if the deletion fails.
   * @param {number} id - The ID of the project to delete
   * @returns {Promise<void>} - Promise that resolves after the project is deleted
   */
  const deleteById = async (id: number): Promise<void> =>
    handleAsyncAction({
      action: async () => {
        await deleteMutation(id).unwrap();
        dispatch(removeById(id));
        router.replace(ROUTES.projects);
        toast.success("Project deleted successfully");
      },
      setIsLoading,
      errorMessage: "Failed to delete project. Please try again.",
    });

  /**
   * Removes a member from the project by their ID.
   * @param {number} projectId - The ID of the project
   * @param {number} memberId - The ID of the member to be removed
   * @returns {Promise<void>} - Promise that resolves after the member is removed
   */
  const kick = async (projectId: number, memberId: number): Promise<void> =>
    handleAsyncAction({
      action: async () => {
        await kickMemberMutation({ projectId, memberId }).unwrap();
        dispatch(kickAction({ memberId }));
        toast.success("Member kicked successfully");
      },
      setIsLoading,
      errorMessage: "Failed to kick member. Please try again.",
    });

  /**
   * Allows the current user to leave the project by its ID.
   * @param {number} id - The ID of the project to leave
   * @returns {Promise<void>} - Promise that resolves after the user leaves the project
   */
  const leave = async (id: number) =>
    handleAsyncAction({
      action: async () => {
        await leaveMutation({ projectId: id }).unwrap();
        router.replace(ROUTES.projects);
        toast.success("You have left the project");
      },
      setIsLoading,
      errorMessage: "Failed to leave project. Please try again.",
    });

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
