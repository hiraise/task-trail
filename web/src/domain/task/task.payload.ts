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
