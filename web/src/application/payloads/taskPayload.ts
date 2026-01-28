export type CreateTaskPayload = {
  name: string;
  description?: string;
  assigneeId?: number;
  projectId: number;
};

export type EditTaskPayload = {
  taskId: string | number;
  title: string;
  description?: string;
};

export type ChangeStatusPayload = {
  taskId: string | number;
  statusId: number;
};

export type ChangeAssigneePayload = {
  taskId: string | number;
  assigneeId?: number;
};

export type UpdateTaskPayload = {
  name?: string;
  description?: string;
};

export const createCreateTaskPayload = (
  name: string,
  description: string | undefined,
  assigneeId: number | undefined,
  projectId: string | number,
): CreateTaskPayload => {
  return {
    name,
    description,
    assigneeId: Number(assigneeId),
    projectId: Number(projectId),
  };
};

export const createUpdateTaskPayload = (name?: string, description?: string): UpdateTaskPayload => {
  return {
    name,
    description,
  };
};

export const createChangeAssigneePayload = (
  taskId: number,
  assigneeId?: number,
): ChangeAssigneePayload => {
  return {
    taskId,
    assigneeId,
  };
};

export const createChangeStatusPayload = (
  taskId: number,
  statusId: number,
): ChangeStatusPayload => {
  return {
    taskId,
    statusId,
  };
};
