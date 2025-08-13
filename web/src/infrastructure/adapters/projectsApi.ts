import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

import { projectService } from "../api/projectService";
import { KickMemberArgs, LeaveProjectArgs, TAG_TYPES } from "./projectsApi.types";
import { ProjectMember } from "@/domain/project/project.entity";

const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    /**
     * @endpoint delete
     * Deletes the specified project.
     * @param {number} projectId - The ID of the project to delete.
     * @returns {null} - Returns null upon successful deletion.
     */
    delete: builder.mutation<null, number>({
      queryFn: async (projectId) => {
        await projectService.deleteProject(projectId);
        return { data: null };
      },
      invalidatesTags: (_, __, projectId) => [{ type: TAG_TYPES.PROJECT, id: projectId }],
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
  }),
});

export const {
  useKickMemberMutation,
  useLeaveMutation,
  useGetMembersQuery,
  useLazyGetMembersQuery,
  useDeleteMutation,
} = projectsApi;

export default projectsApi;
