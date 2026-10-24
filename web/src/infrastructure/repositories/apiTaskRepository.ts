import type { TaskRepository } from "@/domain/repositories/TaskRepository";

import type {
  Attachment,
  ChangeTaskAssigneeRequest,
  ChangeTaskDueDateRequest,
  ChangeTaskParentRequest,
  ChangeTaskPriorityRequest,
  ChangeTaskStatusRequest,
  CreateCommentRequest,
  CreateTaskRequest,
  MoveTaskRequest,
  SetArchivedRequest,
  SetTaskLabelsRequest,
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
import { FILE_TRANSFER_TIMEOUT_MS } from "../http/timeouts";

import { toAttachment, toTask, toTaskComment, toTaskEvent, toTaskStatus } from "./mappers";

// Multipart field with the attachment file — uploadTaskAttachment in the contract
const ATTACHMENT_FIELD = "file";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createTaskRepository = (http: HttpClient): TaskRepository => ({
  findById: async (id) => toTask(await http.get<Task>(API_ROUTES.TASK_BY_ID(id))),

  findByProjectId: async (projectId, archived) =>
    (await http.get<Task[]>(API_ROUTES.PROJECT_TASKS(projectId), { params: { archived } })).map(toTask),

  findAssignedToMe: async (archived) =>
    (await http.get<Task[]>(API_ROUTES.USER_TASKS, { params: { archived } })).map(toTask),

  findStatuses: async () =>
    (await http.get<TaskStatus[]>(API_ROUTES.TASK_STATUSES)).map(toTaskStatus),

  create: async ({ projectId, name, description, assigneeId, statusId, priority, dueDate, parentId }) => {
    const body: CreateTaskRequest = {
      projectId,
      name,
      description: description ?? null,
      assigneeId: assigneeId ?? null,
      ...(statusId && { statusId }),
      ...(priority && { priority }),
      ...(dueDate && { dueDate }),
      ...(parentId && { parentId }),
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

  changePriority: async (id, priority) => {
    const body: ChangeTaskPriorityRequest = { priority };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_PRIORITY(id), body));
  },

  changeDueDate: async (id, dueDate) => {
    const body: ChangeTaskDueDateRequest = { dueDate };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_DUE_DATE(id), body));
  },

  changeAssignee: async (id, assigneeId) => {
    const body: ChangeTaskAssigneeRequest = { assigneeId };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_ASSIGNEE(id), body));
  },

  setLabels: async (id, labelIds) => {
    const body: SetTaskLabelsRequest = { labelIds };

    return toTask(await http.put<Task>(API_ROUTES.TASK_LABELS(id), body));
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

  findSubtasks: async (id) =>
    (await http.get<Task[]>(API_ROUTES.TASK_SUBTASKS(id))).map(toTask),

  changeParent: async (id, parentId) => {
    const body: ChangeTaskParentRequest = { parentId };

    return toTask(await http.patch<Task>(API_ROUTES.TASK_PARENT(id), body));
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

  findAttachments: async (id) =>
    (await http.get<Attachment[]>(API_ROUTES.TASK_ATTACHMENTS(id))).map(toAttachment),

  uploadAttachment: async (id, file) => {
    const form = new FormData();

    form.append(ATTACHMENT_FIELD, file, file.name);

    const dto = await http.post<Attachment>(API_ROUTES.TASK_ATTACHMENTS(id), form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: FILE_TRANSFER_TIMEOUT_MS,
    });

    return toAttachment(dto);
  },

  deleteAttachment: async (id, fileId) => {
    await http.delete(API_ROUTES.TASK_ATTACHMENT(id, fileId));
  },
});

export const taskRepository: TaskRepository = createTaskRepository(axiosClient);
