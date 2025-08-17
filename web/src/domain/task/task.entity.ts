export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  assigneeId?: number;
}

export const TASK_STATUS = ["Open", "In progress", "To verify", "Done"] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];
