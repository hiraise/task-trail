import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

import { projectService } from "../api/projectService";

const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Project", "Member", "ProjectCandidate"],
  endpoints: (builder) => ({
    kickMember: builder.mutation<void, { projectId: number; memberId: number }>({
      queryFn: async ({ projectId, memberId }) => {
        try {
          await projectService.kickMember(projectId, memberId);
          return { data: undefined };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Member", id: projectId },
        { type: "ProjectCandidate", id: projectId },
      ],
    }),
  }),
});

export const { useKickMemberMutation } = projectsApi;

export default projectsApi;
