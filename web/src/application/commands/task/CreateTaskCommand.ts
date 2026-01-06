export interface CreateTaskCommand {
  name: string;
  description?: string;
  assigneeId?: number;
  projectId: number;
}
