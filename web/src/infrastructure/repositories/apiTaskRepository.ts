import type { TaskRepository } from "@/domain/repositories/TaskRepository";

import type {
  ChangeTaskAssigneeRequest,
  ChangeTaskStatusRequest,
  CreateTaskRequest,
  MoveTaskRequest,
  Task,
  TaskStatus,
  UpdateTaskRequest,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

import { toTask, toTaskStatus } from "./mappers";

// Ошибки приходят из HttpClient уже как AppError с кодом API (http/apiError.ts).
const createTaskRepository = (http: HttpClient): TaskRepository => ({
  findById: async (id) => toTask(await http.get<Task>(API_ROUTES.TASK_BY_ID(id))),

  findByProjectId: async (projectId) =>
    (await http.get<Task[]>(API_ROUTES.PROJECT_TASKS(projectId))).map(toTask),

  findAssignedToMe: async () => (await http.get<Task[]>(API_ROUTES.USER_TASKS)).map(toTask),

  findStatuses: async () =>
    (await http.get<TaskStatus[]>(API_ROUTES.TASK_STATUSES)).map(toTaskStatus),

  create: async ({ projectId, name, description, assigneeId }) => {
    const body: CreateTaskRequest = {
      projectId,
      name,
      description: description ?? null,
      assigneeId: assigneeId ?? null,
    };

    return toTask(await http.post<Task>(API_ROUTES.TASKS, body));
  },

  update: async (id, changes) => {
    const body: UpdateTaskRequest = changes;

    return toTask(await http.patch<Task>(API_ROUTES.TASK_BY_ID(id), body));
  },

  changeStatus: async (id, statusId) => {
    const body: ChangeTaskStatusRequest = { statusId };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_STATUS(id), body));
  },

  changeAssignee: async (id, assigneeId) => {
    const body: ChangeTaskAssigneeRequest = { assigneeId };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_ASSIGNEE(id), body));
  },

  move: async (id, projectId) => {
    const body: MoveTaskRequest = { projectId };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_PROJECT(id), body));
  },

  delete: async (id) => {
    await http.delete(API_ROUTES.TASK_BY_ID(id));
  },
});

export const taskRepository: TaskRepository = createTaskRepository(axiosClient);
