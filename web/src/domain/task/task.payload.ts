export type TaskPayload = {
  name: string;
  description?: string;
  assigneeId?: number;
  projectId: number;
};

export type ChangeStatusPayload = {
  id: number;
  statusId: number;
};

export type ChangeAssigneePayload = {
  id: number;
  assigneeId: number;
};

export type EditTaskPayload = {
  name: string;
  description?: string;
};
