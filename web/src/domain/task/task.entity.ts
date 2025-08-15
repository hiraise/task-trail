export interface Task {
  id: number;
  title: string;
  description: string;
  status: (typeof TASK_STATUS)[number];
  createdAt: Date;
  updatedAt: Date;
  projectId: number;
  assigneeId?: number;
}

export const TASK_STATUS = ["Open", "In progress", "To verify", "Done"] as const;
