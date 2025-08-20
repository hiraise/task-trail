export interface Task {
  id: number;
  title: string;
  description?: string;
  statusId: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  authorId: number;
  assigneeId?: number;
}

export interface TaskStatus {
  id: number;
  name: string;
  isDefault: boolean;
  isResolved: boolean;
}
