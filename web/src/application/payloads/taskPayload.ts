export interface CreateTaskPayload {
  name: string;
  description?: string;
  assigneeId?: number;
  projectId: number;
}

export interface EditTaskPayload {
  taskId: string | number;
  title: string;
  description?: string;
}

export interface ChangeStatusPayload {
  taskId: string | number;
  statusId: number;
}

export interface ChangeAssigneePayload {
  taskId: string | number;
  assigneeId: number;
}
