import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

import { projectService } from "../api/projectService";
import { User } from "@/domain/user/user.entity";
import { Project, ProjectMember } from "@/domain/project/project.entity";
import {
  AddMembersArgs,
  CreateProjectArgs,
  EditProjectArgs,
  KickMemberArgs,
  LeaveProjectArgs,
  GetTasksArgs,
  TAG_TYPES,
} from "./projectsApi.types";

import { Task } from "@/domain/task/task.entity";

const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    /**
     * @endpoint create
     * Creates a new project.
     *
     * @param {CreateProjectArgs} newProject - The arguments required to create a new project (name, description, participants).
     * @returns {Project} - The newly created project object.
     * @invalidatesTags PROJECTS, PROJECT, MEMBER, CANDIDATE - Invalidates the projects list, the newly created project, its members, and candidates.
     */
    create: builder.mutation<Project, CreateProjectArgs>({
      queryFn: async (newProject) => {
        const project = await projectService.newProject(newProject);
        if (newProject.participants && newProject.participants.length > 0) {
          await projectService.addMembers(newProject.participants, project.id);
        }
        return { data: project };
      },
      invalidatesTags: (result) => [
        { type: TAG_TYPES.PROJECTS, id: "LIST" },
        ...(result
          ? [
              { type: TAG_TYPES.PROJECT, id: result.id },
              { type: TAG_TYPES.MEMBER, id: result.id },
              { type: TAG_TYPES.CANDIDATE, id: result.id },
            ]
          : []),
      ],
    }),
    /**
     * @endpoint getCandidates
     * Retrieves the list of candidate users for a specified project or all projects.
     *
     * @remarks
     * This endpoint fetches users who are candidates to become members of the given project.
     * If `projectId` is `undefined`, candidates from all projects will be retrieved.
     *
     * @param {number | undefined} projectId - The ID of the project to fetch candidates for. If `undefined`, candidates from all projects are returned.
     * @returns {User[]} An array of user objects representing candidates for the project(s).
     * @providesTags CANDIDATE - Provides candidate tags for the given project or all projects.
     */
    getCandidates: builder.query<User[], number | undefined>({
      queryFn: async (projectId) => {
        const candidates = await projectService.getProjectCandidates(projectId);
        return { data: candidates };
      },
      providesTags: (_, __, projectId) => [{ type: TAG_TYPES.CANDIDATE, id: projectId }],
    }),
    /**
     * @endpoint addMembers
     * Adds one or more members to a specified project.
     * @param {AddMembersArgs} args - The arguments containing `emails` (array of member email addresses) and `id` (project ID).
     * @returns {null} - Returns null upon successful addition of members.
     * @invalidatesTags PROJECT - Invalidates the tag for the specific project to refresh its data.
     */
    addMembers: builder.mutation<null, AddMembersArgs>({
      queryFn: async ({ emails, id }) => {
        await projectService.addMembers(emails, id);
        return { data: null };
      },
      invalidatesTags: (_, __, { id }) => [{ type: TAG_TYPES.PROJECT, id }],
    }),

    /**
     * @endpoint get
     * Retrieves the list of all projects.
     * @returns {Project[]} - An array of project objects.
     * @providesTags PROJECTS - Provides tag for the projects list.
     */
    get: builder.query<Project[], void>({
      queryFn: async () => {
        const projects = await projectService.getProjects();
        return { data: projects };
      },
      providesTags: [{ type: TAG_TYPES.PROJECTS, id: "LIST" }],
    }),
    /**
     * @endpoint getById
     * Retrieves a project by its ID.
     * @param {number} id - The ID of the project to fetch.
     * @returns {Project | null} - The project object or null if not found.
     * @providesTags PROJECT - Provides a tag for the fetched project.
     */
    getById: builder.query<Project | null, number>({
      queryFn: async (id) => {
        const project = await projectService.getProjectById(id);
        return { data: project };
      },
      providesTags: (_, __, id) => [{ type: TAG_TYPES.PROJECT, id }],
    }),
    /**
     * @endpoint edit
     * Updates the specified project with new data.
     * @param {EditProjectArgs} args - The arguments containing `id` and update `payload`.
     * @returns {null} - Returns null upon successful update.
     * @invalidatesTags PROJECT, PROJECTS - Invalidates the specific project and projects list.
     */
    edit: builder.mutation<null, EditProjectArgs>({
      queryFn: async ({ id, payload }) => {
        await projectService.editProject(id, payload);
        return { data: null };
      },
      invalidatesTags: (_, __, args) => [
        { type: TAG_TYPES.PROJECT, id: args.id },
        { type: TAG_TYPES.PROJECTS, id: "LIST" },
      ],
    }),
    /**
     * @endpoint delete
     * Deletes the specified project.
     *
     * @remarks
     * This endpoint removes a project by its ID. Upon successful deletion, the projects list tag is invalidated to ensure the UI reflects the updated state.
     *
     * @param {number} projectId - The ID of the project to delete.
     * @returns {null} Returns null upon successful deletion.
     * @invalidatesTags PROJECTS - Invalidates the tag for the projects list.
     */
    delete: builder.mutation<null, number>({
      queryFn: async (projectId) => {
        await projectService.deleteProject(projectId);
        return { data: null };
      },
      invalidatesTags: [{ type: TAG_TYPES.PROJECTS, id: "LIST" }],
    }),
    /**
     * @endpoint getMembers
     * Retrieves the list of members for the specified project.
     * @param {number} projectId - The ID of the project to fetch members for.
     * @returns {ProjectMember[]} - Array of project members.
     * @providesTags MEMBER - Provides member tags for the given project.
     */
    getMembers: builder.query<ProjectMember[], number>({
      queryFn: async (projectId) => {
        const members = await projectService.getMembers(projectId);
        return { data: members };
      },

      providesTags: (_, __, projectId) => [{ type: TAG_TYPES.MEMBER, id: projectId }],
    }),
    /**
     * @endpoint kickMember
     * Removes a member from the specified project.
     * @param {KickMemberArgs} args - The arguments containing `projectId` and `memberId`.
     * @returns {null} - Returns null upon successful completion.
     * @invalidatesTags MEMBER, CANDIDATE - Invalidates member and candidate tags for the given project.
     */
    kickMember: builder.mutation<null, KickMemberArgs>({
      queryFn: async ({ projectId, memberId }) => {
        await projectService.kickMember(projectId, memberId);
        return { data: null };
      },
      invalidatesTags: (_, __, { projectId }) => [
        { type: TAG_TYPES.MEMBER, id: projectId },
        { type: TAG_TYPES.CANDIDATE, id: projectId },
      ],
    }),
    /**
     * @endpoint leave
     * Allows the current user to leave the specified project.
     * @param {LeaveProjectArgs} args - The arguments containing `projectId`.
     * @returns {null} - Returns null upon successful completion.
     * @invalidatesTags MEMBER, CANDIDATE - Invalidates member and candidate tags for the given project.
     */
    leave: builder.mutation<null, LeaveProjectArgs>({
      queryFn: async ({ projectId }) => {
        await projectService.leave(projectId);
        return { data: null };
      },
      invalidatesTags: (_, __, { projectId }) => [
        { type: TAG_TYPES.MEMBER, id: projectId },
        { type: TAG_TYPES.CANDIDATE, id: projectId },
      ],
    }),
    getTasks: builder.query<Task[], GetTasksArgs>({
      queryFn: async ({ projectId }) => {
        const tasks = await projectService.getTasks(projectId);
        return { data: tasks };
      },
      providesTags: (_, __, { projectId }) => [{ type: TAG_TYPES.TASKS, id: projectId }],
    }),
  }),
});

export const {
  useCreateMutation,
  useLazyGetCandidatesQuery,
  useAddMembersMutation,
  useLazyGetQuery,
  useLazyGetByIdQuery,
  useKickMemberMutation,
  useLeaveMutation,
  useGetMembersQuery,
  useLazyGetMembersQuery,
  useDeleteMutation,
  useEditMutation,
  useLazyGetTasksQuery,
} = projectsApi;

export default projectsApi;
