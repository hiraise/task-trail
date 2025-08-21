export type TaskPayload = {
  name: string;
  description?: string;
  assigneeId?: number;
  projectId: number;
};
