import type { TaskRepository } from "@/domain/repositories/TaskRepository";

import type {
  ChangeTaskAssigneeRequest,
  ChangeTaskStatusRequest,
  CreateCommentRequest,
  CreateTaskRequest,
  MoveTaskRequest,
  SetArchivedRequest,
  Task,
  TaskComment,
  TaskEvent,
  TaskStatus,
  UpdateCommentRequest,
  UpdateTaskRequest,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

import { toTask, toTaskComment, toTaskEvent, toTaskStatus } from "./mappers";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createTaskRepository = (http: HttpClient): TaskRepository => ({
  findById: async (id) => toTask(await http.get<Task>(API_ROUTES.TASK_BY_ID(id))),

  findByProjectId: async (projectId, archived) =>
    (await http.get<Task[]>(API_ROUTES.PROJECT_TASKS(projectId), { params: { archived } })).map(toTask),

  findAssignedToMe: async (archived) =>
    (await http.get<Task[]>(API_ROUTES.USER_TASKS, { params: { archived } })).map(toTask),

  findStatuses: async () =>
    (await http.get<TaskStatus[]>(API_ROUTES.TASK_STATUSES)).map(toTaskStatus),

  create: async ({ projectId, name, description, assigneeId, statusId }) => {
    const body: CreateTaskRequest = {
      projectId,
      name,
      description: description ?? null,
      assigneeId: assigneeId ?? null,
      ...(statusId && { statusId }),
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

  setArchived: async (id, archived) => {
    const body: SetArchivedRequest = { archived };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_ARCHIVED(id), body));
  },

  delete: async (id) => {
    await http.delete(API_ROUTES.TASK_BY_ID(id));
  },

  findComments: async (taskId) =>
    (await http.get<TaskComment[]>(API_ROUTES.TASK_COMMENTS(taskId))).map(toTaskComment),

  createComment: async (taskId, text) => {
    const body: CreateCommentRequest = { text };

    return toTaskComment(await http.post<TaskComment>(API_ROUTES.TASK_COMMENTS(taskId), body));
  },

  updateComment: async (taskId, commentId, text) => {
    const body: UpdateCommentRequest = { text };

    return toTaskComment(
      await http.patch<TaskComment>(API_ROUTES.TASK_COMMENT(taskId, commentId), body),
    );
  },

  deleteComment: async (taskId, commentId) => {
    await http.delete(API_ROUTES.TASK_COMMENT(taskId, commentId));
  },

  findEvents: async (taskId) =>
    (await http.get<TaskEvent[]>(API_ROUTES.TASK_EVENTS(taskId))).map(toTaskEvent),
});

export const taskRepository: TaskRepository = createTaskRepository(axiosClient);
