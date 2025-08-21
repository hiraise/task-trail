import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

import { TAG_TYPES } from "./projectsApi.types";
import { Task } from "@/domain/task/task.entity";
import { taskService } from "../api/taskService";
import { TaskPayload } from "@/domain/task/task.payload";

const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    /**
     * @endpoint create
     * Creates a new task in the specified project.
     * @param {CreateTaskArgs} args - The arguments containing `projectId` (ID of the project), `title` (task title), `description` (task details), and other optional task properties.
     * @returns {Task} - Returns the created Task object upon success.
     * @invalidatesTags TASKS - Invalidates the TASKS tag to refresh the list of tasks for the project.
     */
    create: builder.mutation<Task, TaskPayload>({
      queryFn: async (payload) => {
        const task = await taskService.create(payload);
        return { data: task };
      },
    }),
  }),
});

export const { useCreateMutation } = tasksApi;

export default tasksApi;
